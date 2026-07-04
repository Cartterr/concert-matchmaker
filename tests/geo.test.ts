import { describe, expect, it } from "vitest";
import { distanceMiles } from "@/lib/geo";

describe("distanceMiles", () => {
  it("calculates approximate distance across Downtown LA", () => {
    const freehand = { latitude: 34.0448, longitude: -118.2566 };
    const conventionCenter = { latitude: 34.0407, longitude: -118.2690 };

    expect(distanceMiles(freehand, conventionCenter)).toBeGreaterThan(0.6);
    expect(distanceMiles(freehand, conventionCenter)).toBeLessThan(1.0);
  });
});
