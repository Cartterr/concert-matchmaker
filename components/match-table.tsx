import Image from "next/image";
import { ExternalLink, Ticket } from "lucide-react";
import { ReviewButtons } from "@/components/review-buttons";
import { formatDateTimeInZone } from "@/lib/time";
import { cn } from "@/lib/ui";

type MatchRow = {
  id: string;
  confidence: number;
  status: string;
  distanceMiles: number | null;
  sourceProvider: string;
  artist: { name: string; imageUrl?: string | null };
  trip?: { timezone: string };
  event: {
    title: string;
    startAt: Date | null;
    timezone?: string | null;
    providerUrl: string | null;
    ticketUrl: string | null;
    venue: { name: string; city: string | null; region: string | null } | null;
  };
};

const statusStyles: Record<string, string> = {
  PENDING: "border-cyan/30 bg-cyan/10 text-cyan",
  AMBIGUOUS: "border-magenta/30 bg-magenta/10 text-magenta",
  ACCEPTED: "border-accent/30 bg-accent/10 text-accent",
  REJECTED: "border-border bg-muted text-muted-foreground",
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
      <div className="panel flex flex-col items-center gap-4 p-10 text-center">
        <div className="eq eq--muted" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div>
          <p className="text-sm font-semibold">No matches yet</p>
          <p className="mt-1 font-mono text-xs text-faint">
            import catalog → run scan → review signal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="table-head">
            <tr>
              <th scope="col" className="px-4 py-3">
                Artist
              </th>
              <th scope="col" className="px-4 py-3">
                Event
              </th>
              <th scope="col" className="px-4 py-3">
                Venue
              </th>
              <th scope="col" className="px-4 py-3">
                Confidence
              </th>
              <th scope="col" className="px-4 py-3">
                Source
              </th>
              {showReview ? (
                <th scope="col" className="px-4 py-3">
                  Review
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {matches.map((match) => {
              const manualConfirmed = isManualConfirmed(match);
              return (
                <tr
                  key={match.id}
                  className={cn(
                    "align-top transition-colors hover:bg-panel-raised",
                    manualConfirmed && "bg-warning/[0.06]",
                    match.status === "REJECTED" && "opacity-45",
                  )}
                >
                <td className="px-4 py-3">
                  <div className="flex min-w-40 items-center gap-3">
                    {match.artist.imageUrl ? (
                      <Image
                        src={match.artist.imageUrl}
                        alt={match.artist.name}
                        width={40}
                        height={40}
                        className="size-10 shrink-0 rounded-md border border-border object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                    ) : (
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted font-mono text-xs text-muted-foreground"
                        aria-hidden="true"
                      >
                        {match.artist.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="font-semibold">{match.artist.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{match.event.title}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {match.event.startAt
                      ? formatDateTimeInZone(
                          match.event.startAt,
                          match.event.timezone ??
                            match.trip?.timezone ??
                            "America/Chicago",
                        )
                      : "date pending"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>{match.event.venue?.name ?? "Unknown venue"}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {[match.event.venue?.city, match.event.venue?.region]
                      .filter(Boolean)
                      .join(", ")}
                    {match.distanceMiles !== null
                      ? ` · ${match.distanceMiles.toFixed(1)} mi`
                      : ""}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ConfidenceMeter confidence={match.confidence} />
                  <span
                    className={cn(
                      "badge mt-2",
                      manualConfirmed
                        ? "border-warning/40 bg-warning/10 text-warning"
                        : (statusStyles[match.status] ?? statusStyles.REJECTED),
                    )}
                  >
                    {manualConfirmed ? "confirmed" : match.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                    {match.sourceProvider}
                  </div>
                  <div className="mt-2 flex gap-2">
                    {match.event.providerUrl ? (
                      <a
                        href={match.event.providerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring inline-flex size-8 items-center justify-center rounded-md border border-border transition-colors hover:border-border-strong hover:bg-muted"
                        title="Open provider page"
                      >
                        <ExternalLink className="size-4" aria-hidden="true" />
                        <span className="sr-only">Open provider page</span>
                      </a>
                    ) : null}
                    {match.event.ticketUrl ? (
                      <a
                        href={match.event.ticketUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-2 font-mono text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                      >
                        <Ticket className="size-3.5" aria-hidden="true" />
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isManualConfirmed(match: MatchRow) {
  return match.sourceProvider === "manual-confirmed" && match.confidence === 100;
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const tone =
    confidence >= 94
      ? { bar: "bg-accent", text: "text-accent" }
      : confidence >= 82
        ? { bar: "bg-warning", text: "text-warning" }
        : { bar: "bg-faint", text: "text-muted-foreground" };

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1 w-16 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Confidence ${confidence} out of 100`}
      >
        <div
          className={cn("h-full rounded-full", tone.bar)}
          style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
        />
      </div>
      <span
        className={cn("font-mono text-xs font-semibold tabular-nums", tone.text)}
      >
        {confidence}
      </span>
    </div>
  );
}
