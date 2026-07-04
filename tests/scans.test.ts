import { describe, expect, it } from "vitest";
import { isEventWithinTrip, sanitizeRunMessage } from "@/lib/scans";
import type { NormalizedProviderEvent } from "@/lib/providers";

const trip = {
  id: "trip",
  name: "LA SIGGRAPH 2026",
  locationName: "Downtown LA",
  latitude: 34.0448,
  longitude: -118.2566,
  radiusMiles: 12,
  startsOn: new Date("2026-07-17T07:00:00.000Z"),
  endsOn: new Date("2026-07-25T06:59:59.000Z"),
  timezone: "America/Los_Angeles",
  isActive: true,
  createdById: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function event(input: Partial<NormalizedProviderEvent> = {}): NormalizedProviderEvent {
  return {
    provider: "manual",
    title: "Show",
    startAt: new Date("2026-07-18T03:30:00.000Z"),
    venue: { name: "Venue" },
    performers: [],
    ...input,
  };
}

describe("scan filtering", () => {
  it("keeps events inside the trip date and radius window", () => {
    expect(
      isEventWithinTrip({
        event: event(),
        trip,
        venueCoordinates: { latitude: 34.0407, longitude: -118.269 },
      }),
    ).toBe(true);
  });

  it("filters events outside the trip date window", () => {
    expect(
      isEventWithinTrip({
        event: event({ startAt: new Date("2026-07-26T03:30:00.000Z") }),
        trip,
        venueCoordinates: { latitude: 34.0407, longitude: -118.269 },
      }),
    ).toBe(false);
  });

  it("filters events outside the radius when coordinates are known", () => {
    expect(
      isEventWithinTrip({
        event: event(),
        trip,
        venueCoordinates: { latitude: 33.7701, longitude: -118.1937 },
      }),
    ).toBe(false);
  });

  it("redacts provider credentials from stored failure messages", () => {
    const message = sanitizeRunMessage(
      new Error(
        "Failed https://example.test?apikey=alpha123&client_secret=hidden456 Bearer abc.def",
      ),
    );

    expect(message).toContain("apikey=[redacted]");
    expect(message).toContain("client_secret=[redacted]");
    expect(message).toContain("Bearer [redacted]");
    expect(message).not.toContain("alpha123");
    expect(message).not.toContain("hidden456");
    expect(message).not.toContain("abc.def");
  });
});
