export const defaultTripProfile = {
  id: "trip_siggraph_2026_downtown_la",
  name: "SIGGRAPH 2026 Downtown LA",
  locationName: "Freehand Los Angeles / Los Angeles Convention Center",
  latitude: 34.0448,
  longitude: -118.2566,
  radiusMiles: 12,
  startsOn: new Date("2026-07-17T00:00:00-07:00"),
  endsOn: new Date("2026-07-24T23:59:59-07:00"),
  timezone: "America/Los_Angeles",
};

export function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}
