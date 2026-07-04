import { describe, expect, it } from "vitest";
import { parseArtistCatalog } from "@/lib/import-artists";

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
});
