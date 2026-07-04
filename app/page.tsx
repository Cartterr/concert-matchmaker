import { AppShell } from "@/components/app-shell";
import { LockedPanel } from "@/components/locked-panel";
import { MatchTable } from "@/components/match-table";
import { ProviderStatusGrid } from "@/components/provider-status-grid";
import { SetupPanel } from "@/components/setup-panel";
import { StatCard } from "@/components/stat-card";
import { prisma } from "@/lib/db";
import { getProviderHealth } from "@/lib/env";
import { getPageAccess } from "@/lib/page-auth";
import { listRankedMatches } from "@/lib/scans";
import { formatTripWindow } from "@/lib/time";
import { defaultTripProfile } from "@/lib/trips";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const access = await getPageAccess();
  const providers = getProviderHealth();

  let data = {
    tripName: defaultTripProfile.name,
    tripWindow: formatTripWindow(defaultTripProfile),
    catalogCount: 0,
    artistCount: 0,
    latestScan: "No scans",
    matches: [],
  } as {
    tripName: string;
    tripWindow: string;
    catalogCount: number;
    artistCount: number;
    latestScan: string;
    matches: Awaited<ReturnType<typeof listRankedMatches>>;
  };
  let error: string | undefined;

  if (access.canRead) {
    try {
      const [trip, catalogs, artistCount, latestRun, matches] = await Promise.all([
        prisma.tripProfile.findFirst({
          where: { isActive: true },
          orderBy: { startsOn: "asc" },
        }),
        prisma.artistCatalog.count(),
        prisma.artist.count(),
        prisma.providerRun.findFirst({ orderBy: { startedAt: "desc" } }),
        listRankedMatches({ limit: 8 }),
      ]);

      data = {
        tripName: trip?.name ?? defaultTripProfile.name,
        tripWindow: formatTripWindow(trip ?? defaultTripProfile),
        catalogCount: catalogs,
        artistCount,
        latestScan: latestRun
          ? `${latestRun.provider} · ${latestRun.status} · ${latestRun.eventsFetched} events`
          : "No scans",
        matches,
      };
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Database query failed.";
    }
  }

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
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Active trip"
              value={data.tripName}
              detail={data.tripWindow}
            />
            <StatCard
              label="Catalogs"
              value={data.catalogCount}
              detail="Imported sets"
            />
            <StatCard
              label="Artists"
              value={data.artistCount}
              detail="Matchable names"
            />
            <StatCard
              label="Latest scan"
              value={data.latestScan}
              detail="Provider run"
            />
          </div>

          <section className="mt-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Provider health</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Missing keys skip cleanly; disabled providers remain visible.
                </p>
              </div>
            </div>
            <ProviderStatusGrid providers={providers} />
          </section>

          <section className="mt-6">
            <div className="mb-3">
              <h2 className="text-base font-semibold">Top ranked matches</h2>
            </div>
            <MatchTable matches={data.matches} showReview={false} />
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
