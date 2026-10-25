import { describe, expect, it } from "vitest";
import { defaultTripProfile } from "@/lib/trips";

describe("defaultTripProfile", () => {
  it("uses McCormick Place as the trip distance origin", () => {
    expect(defaultTripProfile.locationName).toBe(
      "McCormick Place, 2301 S King Dr, Chicago, IL 60616",
    );
    expect(defaultTripProfile.latitude).toBeCloseTo(41.8515, 4);
    expect(defaultTripProfile.longitude).toBeCloseTo(-87.616, 4);
  });
});
