import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { MatchTable } from "@/components/match-table";
import { ProviderStatusGrid } from "@/components/provider-status-grid";
import { SetupPanel } from "@/components/setup-panel";
import { StatCard } from "@/components/stat-card";
import { prisma } from "@/lib/db";
import { getProviderHealth, isAuthConfigured, isDatabaseConfigured } from "@/lib/env";
import { dateOnly, defaultTripProfile } from "@/lib/trips";
import { ensureDefaultTrip, listRankedMatches } from "@/lib/scans";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const authConfigured = isAuthConfigured();
  const databaseConfigured = isDatabaseConfigured();
  const session =
    authConfigured && databaseConfigured ? await auth().catch(() => null) : null;
  const providers = getProviderHealth();

  let data = {
    tripName: defaultTripProfile.name,
    tripWindow: `${dateOnly(defaultTripProfile.startsOn)} to ${dateOnly(defaultTripProfile.endsOn)}`,
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

  if (databaseConfigured) {
    try {
      const [trip, catalogs, artistCount, latestRun, matches] = await Promise.all([
        ensureDefaultTrip(),
        prisma.artistCatalog.count(),
        prisma.artist.count(),
        prisma.providerRun.findFirst({ orderBy: { startedAt: "desc" } }),
        listRankedMatches({ limit: 8 }),
      ]);

      data = {
        tripName: trip.name,
        tripWindow: `${dateOnly(trip.startsOn)} to ${dateOnly(trip.endsOn)}`,
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

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active trip" value={data.tripName} detail={data.tripWindow} />
        <StatCard label="Catalogs" value={data.catalogCount} detail="Imported sets" />
        <StatCard label="Artists" value={data.artistCount} detail="Matchable names" />
        <StatCard label="Latest scan" value={data.latestScan} detail="Provider run" />
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Provider health</h2>
            <p className="mt-1 text-sm text-[#667085]">
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
    </AppShell>
  );
}
