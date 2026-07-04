import { describe, expect, it } from "vitest";
import {
  formatDateInZone,
  formatTripWindow,
  parseLocalDateTimeInZone,
} from "@/lib/time";

describe("time helpers", () => {
  it("formats LA trip dates in the trip timezone, not the server timezone", () => {
    const trip = {
      startsOn: new Date("2026-07-17T07:00:00.000Z"),
      endsOn: new Date("2026-07-25T06:59:59.000Z"),
      timezone: "America/Los_Angeles",
    };

    expect(formatTripWindow(trip)).toBe("2026-07-17 to 2026-07-24");
    expect(formatDateInZone(trip.endsOn, trip.timezone)).toBe("2026-07-24");
  });

  it("parses datetime-local values as trip-local time", () => {
    const parsed = parseLocalDateTimeInZone(
      "2026-07-17T20:30",
      "America/Los_Angeles",
    );

    expect(parsed.toISOString()).toBe("2026-07-18T03:30:00.000Z");
  });
});
