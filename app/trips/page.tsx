import { AppShell } from "@/components/app-shell";
import { LockedPanel } from "@/components/locked-panel";
import { ManualEventForm } from "@/components/manual-event-form";
import { ProviderStatusGrid } from "@/components/provider-status-grid";
import { SetupPanel } from "@/components/setup-panel";
import { TripScanClient } from "@/components/trip-scan-client";
import { prisma } from "@/lib/db";
import { getProviderHealth } from "@/lib/env";
import { getPageAccess } from "@/lib/page-auth";
import { ensureDefaultTrip } from "@/lib/scans";
import { formatTripWindow } from "@/lib/time";
import { defaultTripProfile } from "@/lib/trips";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const access = await getPageAccess();
  let trips = [defaultTripProfile];
  let latestCatalog: { id: string; name: string } | null = null;
  let error: string | undefined;

  if (access.canRead) {
    try {
      await ensureDefaultTrip();
      const [dbTrips, catalog] = await Promise.all([
        prisma.tripProfile.findMany({
          orderBy: [{ isActive: "desc" }, { startsOn: "asc" }],
        }),
        prisma.artistCatalog.findFirst({ orderBy: { createdAt: "desc" } }),
      ]);
      trips = dbTrips;
      latestCatalog = catalog ? { id: catalog.id, name: catalog.name } : null;
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Database query failed.";
    }
  }

  const activeTrip = trips[0];

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

      {access.canRead ? (
      <div className="mt-2 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="panel relative overflow-hidden p-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 size-52 rounded-full bg-accent/5 blur-2xl"
            />
            <p className="kicker">{"// active trip"}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              {activeTrip.name}
            </h1>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="microlabel">Location</dt>
                <dd className="mt-1.5 font-medium">{activeTrip.locationName}</dd>
              </div>
              <div>
                <dt className="microlabel">Window</dt>
                <dd className="mt-1.5 font-mono text-sm font-medium tabular-nums">
                  {formatTripWindow(activeTrip)}
                </dd>
              </div>
              <div>
                <dt className="microlabel">Radius</dt>
                <dd className="mt-1.5 font-mono text-sm font-medium tabular-nums">
                  {activeTrip.radiusMiles} mi
                </dd>
              </div>
              <div>
                <dt className="microlabel">Catalog</dt>
                <dd className="mt-1.5 font-medium">
                  {latestCatalog?.name ?? "No catalog imported"}
                </dd>
              </div>
            </dl>
          </section>

          <TripScanClient tripId={activeTrip.id} catalogId={latestCatalog?.id} />
          <ManualEventForm tripId={activeTrip.id} catalogId={latestCatalog?.id} />
        </div>

        <aside>
          <p className="microlabel">providers</p>
          <h2 className="mb-3 mt-1 text-base font-semibold tracking-tight">
            Provider status
          </h2>
          <ProviderStatusGrid providers={getProviderHealth()} />
        </aside>
      </div>
      ) : null}
    </AppShell>
  );
}
