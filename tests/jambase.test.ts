import { describe, expect, it } from "vitest";
import { mapJamBaseEvent } from "@/lib/providers/adapters";

// Trimmed from a real JamBase v3 /events response.
const concert = {
  "@type": "Concert",
  name: "Pimpinela at Rosemont Theatre",
  identifier: "jambase:16832456",
  url: "https://www.jambase.com/show/pimpinela-rosemont-theatre-20261115",
  image: "https://www.jambase.com/wp-content/uploads/2015/06/pimpinela.jpg",
  eventStatus: "scheduled",
  startDate: "2026-11-15T20:00:00",
  location: {
    "@type": "Venue",
    name: "Rosemont Theatre",
    identifier: "jambase:63740",
    address: {
      streetAddress: "5400 North River Road",
      addressLocality: "Rosemont",
      addressRegion: { alternateName: "IL" },
      addressCountry: { identifier: "US" },
      "x-timezone": "America/Chicago",
    },
    geo: { latitude: 41.9766, longitude: -87.8637 },
  },
  offers: [
    { url: "https://gametime.example/pimpinela", category: "ticketingLinkSecondary" },
    { url: "https://ticketmaster.example/pimpinela", category: "ticketingLinkPrimary" },
  ],
  performer: [
    { "@type": "MusicGroup", name: "Pimpinela", identifier: "jambase:46207", genre: ["latin", "pop"] },
  ],
};

describe("mapJamBaseEvent", () => {
  it("reads the lineup, venue-local time and primary ticket link", () => {
    const event = mapJamBaseEvent(concert)!;
    expect(event.performers.map((performer) => performer.name)).toEqual(["Pimpinela"]);
    expect(event.startAt?.toISOString()).toBe("2026-11-16T02:00:00.000Z");
    expect(event.ticketUrl).toBe("https://ticketmaster.example/pimpinela");
    expect(event.category).toBe("Music · latin");
    expect(event.venue).toMatchObject({ city: "Rosemont", region: "IL", latitude: 41.9766 });
  });
});
