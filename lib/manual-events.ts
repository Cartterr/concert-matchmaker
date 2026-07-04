import { prisma } from "@/lib/db";
import { normalizeName } from "@/lib/normalize";
import { persistNormalizedEvent, matchEventToArtists } from "@/lib/scans";
import type { NormalizedProviderEvent } from "@/lib/providers";

export async function createManualEvent(input: {
  title: string;
  startAt?: string;
  venueName: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  region?: string;
  providerUrl?: string;
  ticketUrl?: string;
  performers: string[];
  tripId?: string;
  catalogId?: string;
  sourceNote?: string;
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

  const event: NormalizedProviderEvent = {
    provider: "manual",
    providerId: `${normalizeName(input.title)}:${input.startAt ?? "unknown"}`,
    title: input.title,
    startAt: input.startAt ? new Date(input.startAt) : undefined,
    startLocal: input.startAt,
    status: "manual",
    providerUrl: input.providerUrl,
    ticketUrl: input.ticketUrl,
    venue: {
      providerId: normalizeName(input.venueName),
      name: input.venueName,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address,
      city: input.city,
      region: input.region,
      country: "US",
    },
    performers: input.performers.map((name) => ({ name })),
  };

  const persisted = await persistNormalizedEvent(event, trip);
  const matchesCreated = await matchEventToArtists({
    eventId: persisted.event.id,
    event,
    artists,
    trip,
    venueCoordinates: persisted.venueCoordinates,
  });

  await prisma.manualImport.create({
    data: {
      sourceNote: input.sourceNote,
      eventsCreated: 1,
    },
  });

  return {
    event: persisted.event,
    matchesCreated,
  };
}
