import { MatchStatus, type Artist, type TripProfile } from "@prisma/client";
import { prisma } from "@/lib/db";
import { distanceMiles } from "@/lib/geo";
import { pickBestScores } from "@/lib/matching";
import {
  buildProviderDedupeKey,
  normalizeArtistName,
  normalizeEventTitle,
} from "@/lib/normalize";
import { getAdapterHealth, getProviderAdapters } from "@/lib/providers";
import type {
  EventSourceKey,
  NormalizedPerformer,
  NormalizedProviderEvent,
  ProviderTrip,
} from "@/lib/providers/types";

const STALE_RUN_MS = 30 * 60 * 1000;
const RADIUS_TOLERANCE = 1.1;

export async function getProviderStatusSummary() {
  return getAdapterHealth();
}

export async function scanTripEvents(input: {
  tripId?: string;
  catalogId?: string;
  requestedById?: string | null;
  startedBy?: string | null;
}) {
  await markStaleProviderRuns();

  const trip = await resolveTrip(input.tripId);
  const catalog = input.catalogId
    ? await prisma.artistCatalog.findUniqueOrThrow({ where: { id: input.catalogId } })
    : await prisma.artistCatalog.findFirst({ orderBy: { createdAt: "desc" } });

  const running = await prisma.providerRun.count({
    where: {
      tripId: trip.id,
      status: "running",
      startedAt: { gt: new Date(Date.now() - STALE_RUN_MS) },
    },
  });
  if (running > 0) {
    throw new Error("A scan is already running for this trip.");
  }

  const artists = catalog
    ? await prisma.artist.findMany({ where: { catalogId: catalog.id } })
    : [];

  const providerRuns = await Promise.all(
    getProviderAdapters().map(async (adapter) => {
      const health = adapter.health();
      const baseRunData = {
        provider: adapter.key,
        tripId: trip.id,
        catalogId: catalog?.id,
        startedById: input.requestedById ?? undefined,
        paramsJson: {
          tripId: trip.id,
          catalogId: catalog?.id ?? null,
          radiusMiles: trip.radiusMiles,
          startsOn: trip.startsOn,
          endsOn: trip.endsOn,
          timezone: trip.timezone,
          startedBy: input.startedBy ?? null,
        },
      };

      if (health.status !== "ready") {
        return prisma.providerRun.create({
          data: {
            ...baseRunData,
            status: "skipped",
            skippedReason: health.message,
            completedAt: new Date(),
            message: health.message,
          },
        });
      }

      const run = await prisma.providerRun.create({
        data: {
          ...baseRunData,
          status: "running",
        },
      });

      try {
        const result = await adapter.scanEvents(toProviderTrip(trip));
        let eventsFetched = 0;
        let matchesCreated = 0;

        for (const event of result.events) {
          const persisted = await persistNormalizedEvent(event);
          const venueCoordinates = persisted.venueCoordinates;

          if (!isEventWithinTrip({ event, trip, venueCoordinates })) {
            continue;
          }

          eventsFetched += 1;
          matchesCreated += await matchEventToArtists({
            eventId: persisted.event.id,
            event,
            artists,
            trip,
            providerRunId: run.id,
            venueCoordinates,
          });
        }

        return prisma.providerRun.update({
          where: { id: run.id },
          data: {
            status: "completed",
            completedAt: new Date(),
            eventsFetched,
            matchesCreated,
            message: result.message,
          },
        });
      } catch (error) {
        return prisma.providerRun.update({
          where: { id: run.id },
          data: {
            status: "failed",
            completedAt: new Date(),
            errorClass: error instanceof Error ? error.name : "ProviderError",
            message: sanitizeRunMessage(error),
          },
        });
      }
    }),
  );

  return {
    trip,
    catalog,
    providerRuns,
    eventsFetched: providerRuns.reduce((sum, run) => sum + run.eventsFetched, 0),
    matchesCreated: providerRuns.reduce((sum, run) => sum + run.matchesCreated, 0),
  };
}

export async function persistNormalizedEvent(event: NormalizedProviderEvent) {
  const venueProviderId =
    event.venue.providerId ??
    `${normalizeArtistName(event.venue.name)}:${event.venue.latitude ?? "na"}:${event.venue.longitude ?? "na"}`;

  const venue = await prisma.venue.upsert({
    where: {
      provider_providerId: {
        provider: event.provider,
        providerId: venueProviderId,
      },
    },
    create: {
      provider: event.provider,
      providerId: venueProviderId,
      name: event.venue.name,
      normalizedName: normalizeArtistName(event.venue.name),
      latitude: event.venue.latitude,
      longitude: event.venue.longitude,
      address: event.venue.address,
      city: event.venue.city,
      region: event.venue.region,
      country: event.venue.country,
      url: event.venue.url,
    },
    update: {
      name: event.venue.name,
      normalizedName: normalizeArtistName(event.venue.name),
      latitude: event.venue.latitude,
      longitude: event.venue.longitude,
      address: event.venue.address,
      city: event.venue.city,
      region: event.venue.region,
      country: event.venue.country,
      url: event.venue.url,
    },
  });

  const dedupeKey = buildProviderDedupeKey({
    provider: event.provider,
    providerId: event.providerId,
    title: event.title,
    startAt: event.startAt,
    venueName: event.venue.name,
  });

  const storedEvent = await prisma.event.upsert({
    where: { dedupeKey },
    create: {
      dedupeKey,
      title: event.title,
      normalizedTitle: normalizeEventTitle(event.title),
      startAt: event.startAt,
      startLocal: event.startLocal,
      timezone: event.timezone,
      status: event.status ?? "scheduled",
      provider: event.provider,
      providerId: event.providerId,
      providerUrl: event.providerUrl,
      ticketUrl: event.ticketUrl,
      rawPayloadRef: event.rawPayloadRef,
      venueId: venue.id,
    },
    update: {
      title: event.title,
      normalizedTitle: normalizeEventTitle(event.title),
      startAt: event.startAt,
      startLocal: event.startLocal,
      timezone: event.timezone,
      status: event.status ?? "scheduled",
      providerUrl: event.providerUrl,
      ticketUrl: event.ticketUrl,
      rawPayloadRef: event.rawPayloadRef,
      venueId: venue.id,
    },
  });

  const performers =
    event.performers.length > 0
      ? event.performers
      : [{ name: event.title, billing: "event_title" }];

  for (const performer of performers) {
    const normalizedName = normalizeArtistName(performer.name);
    if (!normalizedName) continue;

    await prisma.performer.upsert({
      where: {
        eventId_normalizedName: {
          eventId: storedEvent.id,
          normalizedName,
        },
      },
      create: {
        eventId: storedEvent.id,
        name: performer.name,
        normalizedName,
        billing: performer.billing,
        providerId: performer.providerId,
        externalIds: performer.externalIds ?? {},
      },
      update: {
        name: performer.name,
        billing: performer.billing,
        providerId: performer.providerId,
        externalIds: performer.externalIds ?? {},
      },
    });
  }

  return {
    event: storedEvent,
    venue,
    venueCoordinates:
      venue.latitude !== null && venue.longitude !== null
        ? { latitude: venue.latitude, longitude: venue.longitude }
        : undefined,
  };
}

export async function matchEventToArtists(input: {
  eventId: string;
  event: NormalizedProviderEvent;
  artists: Artist[];
  trip: TripProfile;
  providerRunId?: string;
  venueCoordinates?: { latitude: number; longitude: number };
}) {
  if (input.artists.length === 0) return 0;

  const performers = normalizePerformers(input.event.performers, input.event.title);
  const scores = pickBestScores(performers, input.artists);
  const bestByArtist = new Map<string, (typeof scores)[number]>();

  for (const score of scores) {
    if (!score.artist.id) continue;
    const existing = bestByArtist.get(score.artist.id);
    if (!existing || score.confidence > existing.confidence) {
      bestByArtist.set(score.artist.id, score);
    }
  }

  let created = 0;
  const distance =
    input.venueCoordinates &&
    distanceMiles(
      { latitude: input.trip.latitude, longitude: input.trip.longitude },
      input.venueCoordinates,
    );

  for (const [artistId, score] of bestByArtist) {
    const where = {
      eventId_artistId_tripId: {
        eventId: input.eventId,
        artistId,
        tripId: input.trip.id,
      },
    };
    const existing = await prisma.match.findUnique({ where });
    const updateStatus =
      existing?.status === MatchStatus.ACCEPTED ||
      existing?.status === MatchStatus.REJECTED
        ? existing.status
        : score.status;

    if (!existing) created += 1;

    await prisma.match.upsert({
      where,
      create: {
        eventId: input.eventId,
        artistId,
        tripId: input.trip.id,
        providerRunId: input.providerRunId,
        confidence: score.confidence,
        status: score.status,
        reasons: score.reasons,
        sourceProvider: input.event.provider,
        distanceMiles: distance,
      },
      update: {
        providerRunId: input.providerRunId,
        confidence: score.confidence,
        status: updateStatus,
        reasons: score.reasons,
        sourceProvider: input.event.provider,
        distanceMiles: distance,
      },
    });
  }

  return created;
}

export async function listRankedMatches(input: {
  catalogId?: string;
  tripId?: string;
  status?: MatchStatus;
  provider?: string;
  q?: string;
  minConfidence?: number;
  limit?: number;
}) {
  const query = input.q?.trim();
  return prisma.match.findMany({
    where: {
      tripId: input.tripId,
      status: input.status,
      sourceProvider: input.provider,
      confidence:
        input.minConfidence !== undefined ? { gte: input.minConfidence } : undefined,
      artist: input.catalogId ? { catalogId: input.catalogId } : undefined,
      OR: query
        ? [
            { artist: { name: { contains: query, mode: "insensitive" } } },
            {
              artist: {
                catalog: { name: { contains: query, mode: "insensitive" } },
              },
            },
            { event: { title: { contains: query, mode: "insensitive" } } },
            {
              event: {
                venue: { name: { contains: query, mode: "insensitive" } },
              },
            },
          ]
        : undefined,
    },
    include: {
      artist: true,
      event: {
        include: {
          venue: true,
          performers: true,
        },
      },
      trip: true,
      providerRun: true,
    },
    orderBy: [
      { confidence: "desc" },
      { distanceMiles: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take: Math.min(input.limit ?? 100, 250),
  });
}

export async function reviewMatch(input: {
  matchId: string;
  status: MatchStatus;
  reviewedBy?: string | null;
}) {
  return prisma.match.update({
    where: { id: input.matchId },
    data: {
      status: input.status,
      reviewedAt: new Date(),
      reviewedBy: input.reviewedBy ?? undefined,
    },
    include: {
      artist: true,
      event: { include: { venue: true } },
    },
  });
}

export async function ensureDefaultTrip() {
  const { defaultTripProfile } = await import("@/lib/trips");
  return prisma.tripProfile.upsert({
    where: { id: defaultTripProfile.id },
    create: defaultTripProfile,
    update: {},
  });
}

export async function resolveTrip(tripId?: string) {
  if (tripId) {
    return prisma.tripProfile.findUniqueOrThrow({ where: { id: tripId } });
  }

  return (
    (await prisma.tripProfile.findFirst({
      where: { isActive: true },
      orderBy: { startsOn: "asc" },
    })) ??
    (await prisma.tripProfile.findFirstOrThrow({
      orderBy: { startsOn: "asc" },
    }))
  );
}

async function markStaleProviderRuns() {
  await prisma.providerRun.updateMany({
    where: {
      status: "running",
      startedAt: { lt: new Date(Date.now() - STALE_RUN_MS) },
    },
    data: {
      status: "failed",
      completedAt: new Date(),
      errorClass: "StaleRun",
      message: "Run marked failed after exceeding the stale-run threshold.",
    },
  });
}

function normalizePerformers(
  performers: NormalizedPerformer[],
  eventTitle: string,
) {
  const source = performers.length > 0 ? performers : [{ name: eventTitle }];
  return source
    .map((performer) => ({
      ...performer,
      normalizedName: normalizeArtistName(performer.name),
    }))
    .filter((performer) => performer.normalizedName);
}

function toProviderTrip(trip: TripProfile): ProviderTrip {
  return {
    id: trip.id,
    name: trip.name,
    latitude: trip.latitude,
    longitude: trip.longitude,
    radiusMiles: trip.radiusMiles,
    startsOn: trip.startsOn,
    endsOn: trip.endsOn,
    timezone: trip.timezone,
  };
}

export function isEventWithinTrip(input: {
  event: NormalizedProviderEvent;
  trip: TripProfile;
  venueCoordinates?: { latitude: number; longitude: number };
}) {
  if (input.event.startAt) {
    const time = input.event.startAt.getTime();
    if (time < input.trip.startsOn.getTime() || time > input.trip.endsOn.getTime()) {
      return false;
    }
  }

  if (input.venueCoordinates) {
    const distance = distanceMiles(
      { latitude: input.trip.latitude, longitude: input.trip.longitude },
      input.venueCoordinates,
    );
    return distance <= input.trip.radiusMiles * RADIUS_TOLERANCE;
  }

  return true;
}

export function sanitizeRunMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Provider scan failed";
  return message
    .replace(/apikey=[^&\s]+/gi, "apikey=[redacted]")
    .replace(/client_secret=[^&\s]+/gi, "client_secret=[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .slice(0, 500);
}

export function sourceLabel(source: EventSourceKey) {
  return source === "manual" ? "Manual import" : source;
}
