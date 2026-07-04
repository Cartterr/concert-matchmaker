import { parse } from "csv-parse/sync";
import { z } from "zod";
import { normalizeName } from "@/lib/normalize";

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
  const trimmed = content.trim();
  if (!trimmed) return [];

  const artists = filename.toLowerCase().endsWith(".json") || trimmed[0] === "{"
    ? parseJsonArtists(trimmed)
    : parseCsvArtists(trimmed);

  return dedupeArtists(artists);
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
    externalIds: row.externalIds ?? row.external_ids ?? {},
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
  return {
    name,
    normalizedName: normalizeName(name),
    spotifyId: blankToUndefined(input.spotifyId),
    spotifyUrl: blankToUndefined(input.spotifyUrl),
    likedTrackCount: Math.max(0, input.likedTrackCount ?? 0),
    sampleTracks: uniqueStrings(input.sampleTracks ?? []),
    aliases: uniqueStrings(input.aliases ?? []),
    externalIds: {
      ...(input.externalIds ?? {}),
      ...(blankToUndefined(input.spotifyId)
        ? { spotifyId: blankToUndefined(input.spotifyId)! }
        : {}),
    },
  };
}

function dedupeArtists(artists: ImportedArtist[]) {
  const map = new Map<string, ImportedArtist>();

  for (const artist of artists) {
    if (!artist.name || !artist.normalizedName) continue;
    const existing = map.get(artist.normalizedName);
    if (!existing) {
      map.set(artist.normalizedName, artist);
      continue;
    }

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

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
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

function isObject(value: unknown): value is { artists?: unknown[] } {
  return typeof value === "object" && value !== null;
}
