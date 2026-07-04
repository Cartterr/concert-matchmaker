import { ExternalLink } from "lucide-react";
import { ReviewButtons } from "@/components/review-buttons";

type MatchRow = {
  id: string;
  confidence: number;
  status: string;
  distanceMiles: number | null;
  sourceProvider: string;
  artist: { name: string };
  event: {
    title: string;
    startAt: Date | null;
    providerUrl: string | null;
    ticketUrl: string | null;
    venue: { name: string; city: string | null; region: string | null } | null;
  };
};

export function MatchTable({
  matches,
  showReview = true,
}: {
  matches: MatchRow[];
  showReview?: boolean;
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-panel p-6 text-sm text-muted-foreground">
        No matches yet. Import a catalog, then run the LA SIGGRAPH scan.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-panel">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Artist</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Venue</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Source</th>
              {showReview ? <th className="px-4 py-3">Review</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {matches.map((match) => (
              <tr key={match.id} className="align-top">
                <td className="px-4 py-3 font-medium">{match.artist.name}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{match.event.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {match.event.startAt
                      ? match.event.startAt.toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "Date pending"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>{match.event.venue?.name ?? "Unknown venue"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[match.event.venue?.city, match.event.venue?.region]
                      .filter(Boolean)
                      .join(", ")}
                    {match.distanceMiles !== null
                      ? ` · ${match.distanceMiles.toFixed(1)} mi`
                      : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-md bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                    {match.confidence}
                  </span>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {match.status}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    {match.sourceProvider}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {match.event.providerUrl ? (
                      <a
                        href={match.event.providerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring inline-flex size-8 items-center justify-center rounded-md border border-border"
                        title="Open provider page"
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </a>
                    ) : null}
                    {match.event.ticketUrl ? (
                      <a
                        href={match.event.ticketUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring inline-flex h-8 items-center rounded-md border border-border px-2 text-xs font-medium"
                      >
                        Tickets
                      </a>
                    ) : null}
                  </div>
                </td>
                {showReview ? (
                  <td className="px-4 py-3">
                    <ReviewButtons matchId={match.id} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
