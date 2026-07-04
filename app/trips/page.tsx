import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { ManualEventForm } from "@/components/manual-event-form";
import { ProviderStatusGrid } from "@/components/provider-status-grid";
import { SetupPanel } from "@/components/setup-panel";
import { TripScanClient } from "@/components/trip-scan-client";
import { prisma } from "@/lib/db";
import { getProviderHealth, isAuthConfigured, isDatabaseConfigured } from "@/lib/env";
import { dateOnly, defaultTripProfile } from "@/lib/trips";
import { ensureDefaultTrip } from "@/lib/scans";

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const authConfigured = isAuthConfigured();
  const databaseConfigured = isDatabaseConfigured();
  const session =
    authConfigured && databaseConfigured ? await auth().catch(() => null) : null;

  let trips = [defaultTripProfile];
  let latestCatalog: { id: string; name: string } | null = null;
  let error: string | undefined;

  if (databaseConfigured) {
    try {
      await ensureDefaultTrip();
      const [dbTrips, catalog] = await Promise.all([
        prisma.tripProfile.findMany({ orderBy: { startsOn: "asc" } }),
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
      userName={session?.user?.name ?? session?.user?.email}
      authConfigured={authConfigured}
      databaseConfigured={databaseConfigured}
    >
      {!authConfigured || !databaseConfigured || error ? (
        <SetupPanel
          authConfigured={authConfigured}
          databaseConfigured={databaseConfigured}
          error={error}
        />
      ) : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-[#d7dce2] bg-white p-5">
            <h1 className="text-lg font-semibold">{activeTrip.name}</h1>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#667085]">Location</dt>
                <dd className="mt-1 font-medium">{activeTrip.locationName}</dd>
              </div>
              <div>
                <dt className="text-[#667085]">Window</dt>
                <dd className="mt-1 font-medium">
                  {dateOnly(activeTrip.startsOn)} to {dateOnly(activeTrip.endsOn)}
                </dd>
              </div>
              <div>
                <dt className="text-[#667085]">Radius</dt>
                <dd className="mt-1 font-medium">{activeTrip.radiusMiles} miles</dd>
              </div>
              <div>
                <dt className="text-[#667085]">Catalog</dt>
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
    </AppShell>
  );
}
