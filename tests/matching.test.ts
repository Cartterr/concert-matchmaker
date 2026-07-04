import { MatchStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { scorePerformerArtist } from "@/lib/matching";

describe("scorePerformerArtist", () => {
  it("uses shared Spotify ids as highest confidence", () => {
    expect(
      scorePerformerArtist(
        { name: "Different Name", externalIds: { spotifyId: "sp-123" } },
        { name: "Artist", spotifyId: "sp-123" },
      ),
    ).toMatchObject({
      confidence: 100,
      status: MatchStatus.PENDING,
      reasons: ["shared_spotify_id"],
    });
  });

  it("uses exact normalized names as high confidence", () => {
    expect(
      scorePerformerArtist({ name: "The Cure" }, { name: "Cure" }),
    ).toMatchObject({
      confidence: 94,
      status: MatchStatus.PENDING,
    });
  });

  it("keeps fuzzy matches ambiguous", () => {
    expect(
      scorePerformerArtist(
        { name: "LCD Soundsystem DJ Set" },
        { name: "LCD Soundsystem" },
      ),
    ).toMatchObject({
      confidence: 82,
      status: MatchStatus.AMBIGUOUS,
    });
  });
});
