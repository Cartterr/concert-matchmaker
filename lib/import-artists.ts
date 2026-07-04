import { parse } from "csv-parse/sync";
import { z } from "zod";
import { normalizeArtistName } from "@/lib/normalize";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 20_000;

export type ImportedArtist = {
  name: string;
  normalizedName: string;
  spotifyId?: string;
  spotifyUrl?: string;
  likedTrackCount: number;
  sampleTracks: string[];
  aliases: string[];
  externalIds: Record<string, string>;
};

export type ImportDrop = {
  name: string;
  reason: string;
};

export type ArtistImportSummary = {
  parsed: number;
  imported: number;
  dropped: ImportDrop[];
  duplicatesMerged: number;
};

export type ArtistCatalogParseResult = {
  artists: ImportedArtist[];
  summary: ArtistImportSummary;
};

const jsonArtistSchema = z
  .object({
    name: z.string().optional(),
    artist: z.string().optional(),
    artist_name: z.string().optional(),
    spotifyId: z.string().optional(),
    spotify_id: z.string().optional(),
    artist_id: z.string().optional(),
    spotifyUrl: z.string().optional(),
    spotify_url: z.string().optional(),
    likedTrackCount: z.number().optional(),
    liked_track_count: z.number().optional(),
    track_count: z.number().optional(),
    sampleTracks: z.array(z.string()).optional(),
    sample_tracks: z.union([z.array(z.string()), z.string()]).optional(),
    aliases: z.array(z.string()).optional(),
    externalIds: z.record(z.string(), z.string()).optional(),
    external_ids: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

export function parseArtistCatalog(content: string, filename = "catalog") {
  return parseArtistCatalogWithReport(content, filename).artists;
}

export function parseArtistCatalogWithReport(
  content: string,
  filename = "catalog",
): ArtistCatalogParseResult {
  if (Buffer.byteLength(content, "utf8") > MAX_IMPORT_BYTES) {
    throw new Error(`Import exceeds ${MAX_IMPORT_BYTES} byte limit.`);
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return emptyResult();
  }

  const rawArtists =
    filename.toLowerCase().endsWith(".json") || trimmed[0] === "{"
      ? parseJsonArtists(trimmed)
      : parseCsvArtists(trimmed);

  if (rawArtists.length > MAX_IMPORT_ROWS) {
    throw new Error(`Import exceeds ${MAX_IMPORT_ROWS} row limit.`);
  }

  return dedupeArtists(rawArtists);
}

function parseJsonArtists(content: string) {
  const payload = JSON.parse(content) as unknown;
  const rawArtists = Array.isArray(payload)
    ? payload
    : isObject(payload) && Array.isArray(payload.artists)
      ? payload.artists
      : [];

  return rawArtists.map((entry) => mapJsonArtist(jsonArtistSchema.parse(entry)));
}

function parseCsvArtists(content: string) {
  const rows = parse(content, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  return rows.map(mapCsvArtist);
}

function mapCsvArtist(row: Record<string, string>): ImportedArtist {
  const name =
    firstValue(row, ["artist_name", "name", "artist", "Artist", "Artist Name"]) ??
    "";

  return normalizeImportedArtist({
    name,
    spotifyId: firstValue(row, [
      "spotify_id",
      "spotify_artist_id",
      "artist_id",
      "id",
    ]),
    spotifyUrl: firstValue(row, ["spotify_url", "artist_url", "external_url"]),
    likedTrackCount: toNumber(
      firstValue(row, ["liked_track_count", "track_count", "liked_songs"]),
    ),
    sampleTracks: splitList(
      firstValue(row, ["sample_tracks", "tracks", "sample_track_names"]),
    ),
    aliases: splitList(firstValue(row, ["aliases", "artist_aliases"])),
    externalIds: {},
  });
}

function mapJsonArtist(row: z.infer<typeof jsonArtistSchema>): ImportedArtist {
  return normalizeImportedArtist({
    name: row.name ?? row.artist_name ?? row.artist ?? "",
    spotifyId: row.spotifyId ?? row.spotify_id ?? row.artist_id,
    spotifyUrl: row.spotifyUrl ?? row.spotify_url,
    likedTrackCount:
      row.likedTrackCount ?? row.liked_track_count ?? row.track_count ?? 0,
    sampleTracks: Array.isArray(row.sampleTracks)
      ? row.sampleTracks
      : Array.isArray(row.sample_tracks)
        ? row.sample_tracks
        : splitList(typeof row.sample_tracks === "string" ? row.sample_tracks : ""),
    aliases: row.aliases ?? [],
    externalIds: sanitizeExternalIds(row.externalIds ?? row.external_ids ?? {}),
  });
}

function normalizeImportedArtist(input: {
  name: string;
  spotifyId?: string;
  spotifyUrl?: string;
  likedTrackCount?: number;
  sampleTracks?: string[];
  aliases?: string[];
  externalIds?: Record<string, string>;
}): ImportedArtist {
  const name = input.name.trim();
  const spotifyId = blankToUndefined(input.spotifyId);
  return {
    name,
    normalizedName: normalizeArtistName(name),
    spotifyId,
    spotifyUrl: blankToUndefined(input.spotifyUrl),
    likedTrackCount: Math.max(0, input.likedTrackCount ?? 0),
    sampleTracks: uniqueStrings(input.sampleTracks ?? []),
    aliases: uniqueStrings(input.aliases ?? []),
    externalIds: {
      ...(input.externalIds ?? {}),
      ...(spotifyId ? { spotifyId } : {}),
    },
  };
}

function dedupeArtists(artists: ImportedArtist[]): ArtistCatalogParseResult {
  const map = new Map<string, ImportedArtist>();
  const dropped: ImportDrop[] = [];
  let duplicatesMerged = 0;

  for (const artist of artists) {
    if (!artist.name) {
      dropped.push({ name: "", reason: "missing_name" });
      continue;
    }

    if (!artist.normalizedName) {
      dropped.push({ name: artist.name, reason: "unmatchable_name" });
      continue;
    }

    const existing = map.get(artist.normalizedName);
    if (!existing) {
      map.set(artist.normalizedName, artist);
      continue;
    }

    duplicatesMerged += 1;
    existing.likedTrackCount += artist.likedTrackCount;
    existing.sampleTracks = uniqueStrings([
      ...existing.sampleTracks,
      ...artist.sampleTracks,
    ]);
    existing.aliases = uniqueStrings([...existing.aliases, ...artist.aliases]);
    existing.spotifyId ??= artist.spotifyId;
    existing.spotifyUrl ??= artist.spotifyUrl;
    existing.externalIds = { ...artist.externalIds, ...existing.externalIds };
  }

  const deduped = [...map.values()].sort((a, b) => a.name.localeCompare(b.name));

  return {
    artists: deduped,
    summary: {
      parsed: artists.length,
      imported: deduped.length,
      dropped,
      duplicatesMerged,
    },
  };
}

function emptyResult(): ArtistCatalogParseResult {
  return {
    artists: [],
    summary: {
      parsed: 0,
      imported: 0,
      dropped: [],
      duplicatesMerged: 0,
    },
  };
}

function firstValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value?.trim()) return value.trim();
  }
  return undefined;
}

function splitList(value?: string) {
  return uniqueStrings((value ?? "").split(/[|;,]/g));
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function toNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function blankToUndefined(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function sanitizeExternalIds(value: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, recordValue]) => key.trim() && recordValue.trim(),
    ),
  );
}

function isObject(value: unknown): value is { artists?: unknown[] } {
  return typeof value === "object" && value !== null;
}
