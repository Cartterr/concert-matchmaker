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
      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-border bg-panel p-5">
            <h1 className="text-lg font-semibold">{activeTrip.name}</h1>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="mt-1 font-medium">{activeTrip.locationName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Window</dt>
                <dd className="mt-1 font-medium">
                  {formatTripWindow(activeTrip)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Radius</dt>
                <dd className="mt-1 font-medium">{activeTrip.radiusMiles} miles</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Catalog</dt>
                <dd className="mt-1 font-medium">
                  {latestCatalog?.name ?? "No catalog imported"}
                </dd>
              </div>
            </dl>
          </section>

          <TripScanClient tripId={activeTrip.id} catalogId={latestCatalog?.id} />
          <ManualEventForm tripId={activeTrip.id} catalogId={latestCatalog?.id} />
        </div>

        <aside>
          <h2 className="mb-3 text-base font-semibold">Provider status</h2>
          <ProviderStatusGrid providers={getProviderHealth()} />
        </aside>
      </div>
      ) : null}
    </AppShell>
  );
}
