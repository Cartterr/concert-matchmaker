import Image from "next/image";
import { Filter, Ticket } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { LockedPanel } from "@/components/locked-panel";
import { SetupPanel } from "@/components/setup-panel";
import { getPageAccess } from "@/lib/page-auth";
import { listTripEvents, resolveTrip } from "@/lib/scans";
import { formatDateTimeInZone, formatTripWindow } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getPageAccess();
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  let trip: Awaited<ReturnType<typeof resolveTrip>> | undefined;
  let events: Awaited<ReturnType<typeof listTripEvents>> = [];
  let error: string | undefined;

  if (access.canRead) {
    try {
      trip = await resolveTrip();
      events = await listTripEvents({ trip, q });
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Database query failed.";
    }
  }

  const timezone = trip?.timezone ?? "America/Chicago";
  const days = new Map<string, typeof events>();
  for (const event of events) {
    const day = event.startAt
      ? formatDateTimeInZone(event.startAt, timezone, {
          dateStyle: "full",
          timeStyle: undefined,
        })
      : "Date pending";
    days.set(day, [...(days.get(day) ?? []), event]);
  }
  const matchedCount = events.filter((event) => event.matches.length > 0).length;

  return (
    <AppShell
      userName={access.userName}
      authConfigured={access.authConfigured}
      databaseConfigured={access.databaseConfigured}
    >
      {!access.canRead ? (
        <LockedPanel
          authConfigured={access.authConfigured}
          databaseConfigured={access.databaseConfigured}
        />
      ) : error ? (
        <SetupPanel
          authConfigured={access.authConfigured}
          databaseConfigured={access.databaseConfigured}
          error={error}
        />
      ) : null}

      {access.canRead && trip ? (
        <section className="mt-2 space-y-4">
          <div>
            <p className="kicker">{"// every event"}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              All events · {trip.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {events.length} events within {trip.radiusMiles} mi of{" "}
              {trip.locationName}, {formatTripWindow(trip)}. {matchedCount} feature
              artists from your catalog.
            </p>
          </div>

          <form className="panel p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="microlabel">
                Search
                <input
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="event, venue, performer, category (music, sports…)"
                  className="input font-sans normal-case tracking-normal"
                />
              </label>
              <button type="submit" className="btn btn-ghost mt-[26px] h-10">
                <Filter className="size-4" aria-hidden="true" />
                Apply
              </button>
            </div>
          </form>

          {events.length === 0 ? (
            <div className="panel p-10 text-center text-sm text-muted-foreground">
              No events yet. Run a scan from Trip Scan.
            </div>
          ) : (
            [...days].map(([day, dayEvents]) => (
              <div key={day} className="panel overflow-hidden">
                <h2 className="table-head px-4 py-3">
                  {day} · {dayEvents.length}
                </h2>
                <ul className="divide-y divide-border text-sm">
                  {dayEvents.map((event) => (
                    <li
                      key={event.id}
                      className={
                        event.matches.length > 0
                          ? "grid gap-3 bg-accent/[0.06] px-4 py-3 md:grid-cols-[7rem_6rem_1fr_16rem_auto]"
                          : "grid gap-3 px-4 py-3 md:grid-cols-[7rem_6rem_1fr_16rem_auto]"
                      }
                    >
                      <div className="font-mono text-xs text-muted-foreground">
                        {formatTimes(event.times, timezone)}
                      </div>
                      {eventImage(event) ? (
                        <Image
                          src={eventImage(event)!}
                          alt=""
                          width={96}
                          height={54}
                          className="aspect-video w-24 rounded-md border border-border object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          unoptimized
                        />
                      ) : (
                        <div
                          className="hidden aspect-video w-24 rounded-md border border-border bg-muted md:block"
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {event.category ? (
                            <span className="badge border-border bg-muted text-muted-foreground">
                              {event.category}
                            </span>
                          ) : null}
                          {event.matches.map((match) => (
                            <span
                              key={match.id}
                              className="badge gap-1.5 border-accent/40 bg-accent/10 text-accent"
                            >
                              {match.artist.imageUrl ? (
                                <Image
                                  src={match.artist.imageUrl}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="size-4 rounded-full object-cover"
                                  referrerPolicy="no-referrer"
                                  unoptimized
                                />
                              ) : (
                                "♥"
                              )}
                              {match.artist.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div>{event.venue?.name ?? "Unknown venue"}</div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">
                          {[event.venue?.city, event.venue?.region]
                            .filter(Boolean)
                            .join(", ")}
                          {event.distanceMiles !== null
                            ? ` · ${event.distanceMiles.toFixed(1)} mi`
                            : ""}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-start gap-2">
                        {event.sources.map((source) =>
                          source.url ? (
                            <a
                              key={source.provider}
                              href={source.url}
                              target="_blank"
                              rel="noreferrer"
                              className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-2 font-mono text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                            >
                              <Ticket className="size-3.5" aria-hidden="true" />
                              {source.provider}
                            </a>
                          ) : (
                            <span
                              key={source.provider}
                              className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint"
                            >
                              {source.provider}
                            </span>
                          ),
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      ) : null}
    </AppShell>
  );
}

function formatTimes(times: Date[], timezone: string) {
  const labels = times.map((time) =>
    formatDateTimeInZone(time, timezone, { dateStyle: undefined, timeStyle: "short" }),
  );
  if (labels.length === 0) return "TBA";
  if (labels.length <= 3) return labels.join(" · ");
  return `${labels[0]}–${labels.at(-1)} · ${labels.length} slots`;
}

// SeatGeek's API sends no images, so a SeatGeek-only show by a liked artist
// falls back to that artist's Spotify photo.
function eventImage(event: {
  imageUrl: string | null;
  matches: Array<{ artist: { imageUrl: string | null } }>;
}) {
  return (
    event.imageUrl ??
    event.matches.find((match) => match.artist.imageUrl)?.artist.imageUrl ??
    null
  );
}
