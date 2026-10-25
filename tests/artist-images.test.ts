import { describe, expect, it } from "vitest";
import { extractSpotifyArtistImage } from "@/scripts/backfill-artist-images";

describe("extractSpotifyArtistImage", () => {
  it("reads the public Spotify artist image metadata", () => {
    const html =
      '<html><head><meta property="og:image" content="https://i.scdn.co/image/example&amp;width=640"></head></html>';

    expect(extractSpotifyArtistImage(html)).toBe(
      "https://i.scdn.co/image/example&width=640",
    );
  });

  it("ignores missing artist image metadata", () => {
    expect(extractSpotifyArtistImage("<html></html>")).toBeNull();
  });
});
