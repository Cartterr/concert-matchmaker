import { MatchStatus, type Artist, type TripProfile } from "@prisma/client";
import { prisma } from "@/lib/db";
import { distanceMiles } from "@/lib/geo";
import { pickBestScores } from "@/lib/matching";
import { buildProviderDedupeKey, normalizeName } from "@/lib/normalize";
import { getAdapterHealth, getProviderAdapters } from "@/lib/providers";
import type {
  EventSourceKey,
  NormalizedPerformer,
  NormalizedProviderEvent,
  ProviderTrip,
} from "@/lib/providers/types";

export async function getProviderStatusSummary() {
  return getAdapterHealth();
}

export async function scanTripEvents(input: {
  tripId?: string;
  catalogId?: string;
  requestedById?: string | null;
}) {
  const trip = input.tripId
    ? await prisma.tripProfile.findUniqueOrThrow({ where: { id: input.tripId } })
    : await prisma.tripProfile.findFirstOrThrow({ orderBy: { startsOn: "asc" } });

  const catalog = input.catalogId
    ? await prisma.artistCatalog.findUniqueOrThrow({ where: { id: input.catalogId } })
    : await prisma.artistCatalog.findFirst({ orderBy: { createdAt: "desc" } });

  const artists = catalog
    ? await prisma.artist.findMany({ where: { catalogId: catalog.id } })
    : [];

  let totalEvents = 0;
  let totalMatches = 0;
  const providerRuns = [];

  for (const adapter of getProviderAdapters()) {
    const health = adapter.health();
    if (health.status !== "ready") {
      providerRuns.push(
        await prisma.providerRun.create({
          data: {
            provider: adapter.key,
            status: "skipped",
            skippedReason: health.message,
            completedAt: new Date(),
            message: health.message,
          },
        }),
      );
      continue;
    }

    const run = await prisma.providerRun.create({
      data: {
        provider: adapter.key,
        status: "running",
      },
    });

    try {
      const result = await adapter.scanEvents(toProviderTrip(trip));
      let matchesCreated = 0;

      for (const event of result.events) {
        const persisted = await persistNormalizedEvent(event, trip);
        matchesCreated += await matchEventToArtists({
          eventId: persisted.event.id,
          event,
          artists,
          trip,
          venueCoordinates: persisted.venueCoordinates,
        });
      }

      totalEvents += result.events.length;
      totalMatches += matchesCreated;

      providerRuns.push(
        await prisma.providerRun.update({
          where: { id: run.id },
          data: {
            status: "completed",
            completedAt: new Date(),
            eventsFetched: result.events.length,
            matchesCreated,
            message: result.message,
          },
        }),
      );
    } catch (error) {
      providerRuns.push(
        await prisma.providerRun.update({
          where: { id: run.id },
          data: {
            status: "failed",
            completedAt: new Date(),
            message: error instanceof Error ? error.message : "Provider scan failed",
          },
        }),
      );
    }
  }

  return {
    trip,
    catalog,
    providerRuns,
    eventsFetched: totalEvents,
    matchesCreated: totalMatches,
  };
}

export async function persistNormalizedEvent(
  event: NormalizedProviderEvent,
  trip?: TripProfile,
) {
  const venueProviderId =
    event.venue.providerId ??
    `${normalizeName(event.venue.name)}:${event.venue.latitude ?? "na"}:${event.venue.longitude ?? "na"}`;

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
      normalizedName: normalizeName(event.venue.name),
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
      normalizedName: normalizeName(event.venue.name),
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
      normalizedTitle: normalizeName(event.title),
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
      normalizedTitle: normalizeName(event.title),
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
    const normalizedName = normalizeName(performer.name);
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
        : trip
          ? { latitude: trip.latitude, longitude: trip.longitude }
          : undefined,
  };
}

export async function matchEventToArtists(input: {
  eventId: string;
  event: NormalizedProviderEvent;
  artists: Artist[];
  trip: TripProfile;
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
    const match = await prisma.match.upsert({
      where: {
        eventId_artistId: {
          eventId: input.eventId,
          artistId,
        },
      },
      create: {
        eventId: input.eventId,
        artistId,
        confidence: score.confidence,
        status: score.status,
        reasons: score.reasons,
        sourceProvider: input.event.provider,
        distanceMiles: distance,
      },
      update: {
        confidence: score.confidence,
        status:
          score.status === MatchStatus.AMBIGUOUS ? MatchStatus.AMBIGUOUS : undefined,
        reasons: score.reasons,
        sourceProvider: input.event.provider,
        distanceMiles: distance,
      },
    });
    if (match.createdAt.getTime() === match.updatedAt.getTime()) created += 1;
  }

  return created;
}

export async function listRankedMatches(input: {
  catalogId?: string;
  status?: MatchStatus;
  limit?: number;
}) {
  return prisma.match.findMany({
    where: {
      status: input.status,
      artist: input.catalogId ? { catalogId: input.catalogId } : undefined,
    },
    include: {
      artist: true,
      event: {
        include: {
          venue: true,
          performers: true,
        },
      },
    },
    orderBy: [{ confidence: "desc" }, { distanceMiles: "asc" }, { createdAt: "desc" }],
    take: Math.min(input.limit ?? 100, 250),
  });
}

export async function reviewMatch(input: {
  matchId: string;
  status: MatchStatus;
}) {
  return prisma.match.update({
    where: { id: input.matchId },
    data: { status: input.status },
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
    update: defaultTripProfile,
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
      normalizedName: normalizeName(performer.name),
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

export function sourceLabel(source: EventSourceKey) {
  return source === "manual" ? "Manual import" : source;
}
