import { MatchStatus } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { LockedPanel } from "@/components/locked-panel";
import { MatchFilters, type MatchFilterValues } from "@/components/match-filters";
import { MatchTable } from "@/components/match-table";
import { SetupPanel } from "@/components/setup-panel";
import { getPageAccess } from "@/lib/page-auth";
import { listRankedMatches } from "@/lib/scans";

export const dynamic = "force-dynamic";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await getPageAccess();
  const params = await searchParams;
  const filters = readFilters(params);
  let matches: Awaited<ReturnType<typeof listRankedMatches>> = [];
  let error: string | undefined;

  if (access.canRead) {
    try {
      matches = await listRankedMatches({
        limit: 100,
        provider: filters.provider,
        status: filters.status,
        q: filters.q,
        minConfidence: filters.minConfidence
          ? Number(filters.minConfidence)
          : undefined,
      });
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
        <section className="mt-6 space-y-4">
          <div>
            <h1 className="text-lg font-semibold">Ranked matches</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Accept, reject, or keep ambiguous matches for manual review.
            </p>
          </div>
          <MatchFilters values={filters} />
          <MatchTable matches={matches} />
        </section>
      ) : null}
    </AppShell>
  );
}

function readFilters(params: Record<string, string | string[] | undefined>) {
  return {
    q: scalar(params.q),
    status: readStatus(scalar(params.status)),
    provider: scalar(params.provider),
    minConfidence: scalar(params.minConfidence),
  } satisfies MatchFilterValues;
}

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readStatus(value: string | undefined) {
  return value && value in MatchStatus ? (value as MatchStatus) : undefined;
}
