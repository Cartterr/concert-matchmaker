import { describe, expect, it } from "vitest";
import {
  buildProviderDedupeKey,
  diceTokenScore,
  normalizeEventTitle,
  normalizeName,
} from "@/lib/normalize";

describe("normalizeName", () => {
  it("normalizes accents, punctuation, and leading articles", () => {
    expect(normalizeName("The María & The Machines (feat. Guest)")).toBe(
      "maria and the machines feat guest",
    );
  });

  it("does not strip tokens that are legitimate artist-name words", () => {
    expect(normalizeName("With Confidence")).toBe("with confidence");
    expect(normalizeName("The The")).toBe("the");
    expect(normalizeName("X Ambassadors")).toBe("x ambassadors");
    expect(normalizeName("MØ")).toBe("mo");
    expect(normalizeName("Röyksopp")).toBe("royksopp");
  });

  it("scores token overlap for guarded fuzzy matching", () => {
    expect(diceTokenScore("LCD Soundsystem", "LCD Soundsystem DJ Set")).toBeCloseTo(
      0.67,
      2,
    );
  });
});

describe("normalizeEventTitle", () => {
  it("strips event-title feature annotations without changing artist names", () => {
    expect(normalizeEventTitle("The María & The Machines (feat. Guest)")).toBe(
      "maria and the machines",
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
