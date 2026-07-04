import { MatchStatus } from "@prisma/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { importArtistCatalog } from "@/lib/catalogs";
import { prisma } from "@/lib/db";
import { normalizeName, safeJsonText } from "@/lib/normalize";
import {
  ensureDefaultTrip,
  listRankedMatches,
  reviewMatch,
  scanTripEvents,
} from "@/lib/scans";

const server = new McpServer({
  name: "concert-matchmaker",
  version: "0.1.0",
});

server.registerTool(
  "import_artist_catalog",
  {
    title: "Import Artist Catalog",
    description: "Import a Spotify-derived artist catalog from CSV or JSON text.",
    inputSchema: {
      name: z.string().min(1),
      filename: z.string().optional(),
      content: z.string().min(1),
      source: z.string().optional(),
    },
  },
  async (input) => {
    const result = await importArtistCatalog({
      name: input.name,
      filename: input.filename,
      content: input.content,
      source: input.source ?? input.filename ?? "mcp",
    });

    return jsonToolResult({
      catalogId: result.catalog.id,
      artistCount: result.artistCount,
    });
  },
);

server.registerTool(
  "scan_trip_events",
  {
    title: "Scan Trip Events",
    description: "Run configured event providers for a trip and match events to a catalog.",
    inputSchema: {
      tripId: z.string().optional(),
      catalogId: z.string().optional(),
    },
  },
  async (input) => {
    const trip = input.tripId ? null : await ensureDefaultTrip();
    const result = await scanTripEvents({
      tripId: input.tripId ?? trip?.id,
      catalogId: input.catalogId,
      startedBy: "mcp",
    });

    return jsonToolResult({
      tripId: result.trip.id,
      catalogId: result.catalog?.id ?? null,
      eventsFetched: result.eventsFetched,
      matchesCreated: result.matchesCreated,
      providerRuns: result.providerRuns.map((run) => ({
        provider: run.provider,
        status: run.status,
        eventsFetched: run.eventsFetched,
        matchesCreated: run.matchesCreated,
        message: run.message,
      })),
    });
  },
);

server.registerTool(
  "find_artist_events",
  {
    title: "Find Artist Events",
    description: "Find stored event matches for an artist name.",
    inputSchema: {
      artistName: z.string().min(1),
      limit: z.number().int().positive().max(100).default(25),
    },
  },
  async (input) => {
    const normalizedName = normalizeName(input.artistName);
    const matches = await prisma.match.findMany({
      where: {
        artist: {
          normalizedName,
        },
      },
      include: {
        artist: true,
        event: { include: { venue: true, performers: true } },
        trip: true,
        providerRun: true,
      },
      orderBy: [{ confidence: "desc" }, { distanceMiles: "asc" }],
      take: input.limit,
    });

    return jsonToolResult({ matches: compactMatches(matches) });
  },
);

server.registerTool(
  "list_ranked_matches",
  {
    title: "List Ranked Matches",
    description: "List ranked event matches across the stored catalog.",
    inputSchema: {
      catalogId: z.string().optional(),
      status: z.nativeEnum(MatchStatus).optional(),
      limit: z.number().int().positive().max(250).default(50),
    },
  },
  async (input) => {
    const matches = await listRankedMatches(input);
    return jsonToolResult({ matches: compactMatches(matches) });
  },
);

server.registerTool(
  "review_match",
  {
    title: "Review Match",
    description: "Accept, reject, or mark a match ambiguous.",
    inputSchema: {
      matchId: z.string().min(1),
      status: z.nativeEnum(MatchStatus),
    },
  },
  async (input) => {
    const match = await reviewMatch({ ...input, reviewedBy: "mcp" });
    return jsonToolResult({
      matchId: match.id,
      status: match.status,
      artist: match.artist.name,
      event: match.event.title,
      venue: match.event.venue?.name ?? null,
    });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

function jsonToolResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: safeJsonText(value),
      },
    ],
  };
}

function compactMatches(
  matches: Awaited<ReturnType<typeof listRankedMatches>>,
) {
  return matches.map((match) => ({
    matchId: match.id,
    artist: match.artist.name,
    event: match.event.title,
    startAt: match.event.startAt,
    venue: match.event.venue?.name ?? null,
    city: match.event.venue?.city ?? null,
    confidence: match.confidence,
    status: match.status,
    sourceProvider: match.sourceProvider,
    distanceMiles: match.distanceMiles,
    providerUrl: match.event.providerUrl,
    ticketUrl: match.event.ticketUrl,
  }));
}
