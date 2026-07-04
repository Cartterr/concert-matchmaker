import { describe, expect, it } from "vitest";
import {
  buildProviderDedupeKey,
  diceTokenScore,
  normalizeName,
} from "@/lib/normalize";

describe("normalizeName", () => {
  it("normalizes accents, punctuation, features, and leading articles", () => {
    expect(normalizeName("The María & The Machines (feat. Guest)")).toBe(
      "maria and machines",
    );
  });

  it("scores token overlap for guarded fuzzy matching", () => {
    expect(diceTokenScore("LCD Soundsystem", "LCD Soundsystem DJ Set")).toBeCloseTo(
      0.67,
      2,
    );
  });
});

describe("buildProviderDedupeKey", () => {
  it("uses stable provider ids when present", () => {
    expect(
      buildProviderDedupeKey({
        provider: "ticketmaster",
        providerId: "abc",
        title: "Ignored",
      }),
    ).toBe("ticketmaster:abc");
  });

  it("falls back to title, start, and venue when provider id is absent", () => {
    expect(
      buildProviderDedupeKey({
        provider: "manual",
        title: "Artist Night!",
        startAt: new Date("2026-07-18T04:00:00Z"),
        venueName: "The Regent",
      }),
    ).toBe("manual:artist-night:2026-07-18T04:00:regent");
  });
});
