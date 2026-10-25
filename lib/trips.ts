export const defaultTripProfile = {
  id: "trip_sc26_2026_chicago",
  name: "SC26 Chicago",
  locationName: "McCormick Place, 2301 S King Dr, Chicago, IL 60616",
  latitude: 41.8515,
  longitude: -87.616,
  radiusMiles: 20,
  startsOn: new Date("2026-11-15T00:00:00-06:00"),
  endsOn: new Date("2026-11-20T23:59:59-06:00"),
  timezone: "America/Chicago",
  isActive: true,
};

export function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}
