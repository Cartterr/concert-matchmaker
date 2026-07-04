import { describe, expect, it } from "vitest";
import {
  MAX_IMPORT_BYTES,
  parseArtistCatalog,
  parseArtistCatalogWithReport,
} from "@/lib/import-artists";

describe("parseArtistCatalog", () => {
  it("imports Spotify-style CSV and dedupes normalized names", () => {
    const csv = [
      "artist_name,artist_id,liked_track_count,sample_tracks",
      "The Example Band,sp-1,2,Song A|Song B",
      "Example Band,,1,Song C",
    ].join("\n");

    const artists = parseArtistCatalog(csv, "liked-artists.csv");

    expect(artists).toHaveLength(1);
    expect(artists[0]).toMatchObject({
      name: "The Example Band",
      normalizedName: "example band",
      spotifyId: "sp-1",
      likedTrackCount: 3,
    });
    expect(artists[0].sampleTracks).toEqual(["Song A", "Song B", "Song C"]);
  });

  it("imports JSON artist arrays", () => {
    const artists = parseArtistCatalog(
      JSON.stringify({
        artists: [{ name: "Json Artist", spotify_id: "sp-json" }],
      }),
      "artists.json",
    );

    expect(artists[0].externalIds.spotifyId).toBe("sp-json");
  });

  it("keeps non-Latin and single-letter artist names instead of dropping them", () => {
    const result = parseArtistCatalogWithReport(
      JSON.stringify({
        artists: [{ name: "坂本龍一" }, { name: "X" }, { name: "MØ" }],
      }),
      "artists.json",
    );

    expect(result.summary.imported).toBe(3);
    expect(result.summary.dropped).toEqual([]);
    expect(result.artists.map((artist) => artist.normalizedName)).toEqual([
      "mo",
      "x",
      "坂本龍一",
    ]);
  });

  it("returns import accounting for merged duplicates and dropped rows", () => {
    const result = parseArtistCatalogWithReport(
      JSON.stringify({
        artists: [
          { name: "The Example Band", likedTrackCount: 1 },
          { name: "Example Band", likedTrackCount: 2 },
          { spotifyId: "missing-name" },
        ],
      }),
      "artists.json",
    );

    expect(result.summary).toMatchObject({
      parsed: 3,
      imported: 1,
      duplicatesMerged: 1,
    });
    expect(result.summary.dropped).toEqual([{ name: "", reason: "missing_name" }]);
    expect(result.artists[0].likedTrackCount).toBe(3);
  });

  it("rejects oversized imports before parsing", () => {
    expect(() =>
      parseArtistCatalogWithReport("x".repeat(MAX_IMPORT_BYTES + 1), "artists.csv"),
    ).toThrow(/byte limit/);
  });
});
