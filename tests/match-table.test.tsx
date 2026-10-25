import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MatchTable } from "@/components/match-table";

describe("MatchTable", () => {
  it("renders artist images in the artist column when available", () => {
    const html = renderToStaticMarkup(
      <MatchTable
        showReview={false}
        matches={[
          {
            id: "match-1",
            confidence: 94,
            status: "PENDING",
            distanceMiles: 0.3,
            sourceProvider: "ticketmaster",
            artist: {
              name: "Max Cooper",
              imageUrl: "https://i.scdn.co/image/max-cooper",
            },
            event: {
              title: "Max Cooper",
              startAt: new Date("2026-07-19T02:00:00.000Z"),
              timezone: "America/Los_Angeles",
              providerUrl: null,
              ticketUrl: null,
              venue: {
                name: "The Belasco",
                city: "Los Angeles",
                region: "CA",
              },
            },
          },
        ]}
      />,
    );

    expect(html).toContain('alt="Max Cooper"');
    expect(html).toContain('src="https://i.scdn.co/image/max-cooper"');
  });

  it("highlights manually confirmed matches", () => {
    const html = renderToStaticMarkup(
      <MatchTable
        showReview={false}
        matches={[
          {
            id: "match-1",
            confidence: 100,
            status: "PENDING",
            distanceMiles: null,
            sourceProvider: "manual-confirmed",
            artist: { name: "Mura Masa", imageUrl: null },
            event: {
              title: "Lights Down Low feat. Mura Masa",
              startAt: new Date("2026-07-18T06:00:00.000Z"),
              timezone: "America/Los_Angeles",
              providerUrl: "https://ra.co/events/2452948",
              ticketUrl: "https://ra.co/events/2452948",
              venue: {
                name: "TBA - Downtown LA",
                city: "Los Angeles",
                region: "CA",
              },
            },
          },
        ]}
      />,
    );

    expect(html).toContain(">confirmed</span>");
    expect(html).toContain("manual-confirmed");
    expect(html).toContain("border-warning/40");
  });
});
