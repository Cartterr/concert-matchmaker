import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { MatchTable } from "@/components/match-table";
import { SetupPanel } from "@/components/setup-panel";
import { isAuthConfigured, isDatabaseConfigured } from "@/lib/env";
import { listRankedMatches } from "@/lib/scans";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const authConfigured = isAuthConfigured();
  const databaseConfigured = isDatabaseConfigured();
  const session =
    authConfigured && databaseConfigured ? await auth().catch(() => null) : null;
  let matches: Awaited<ReturnType<typeof listRankedMatches>> = [];
  let error: string | undefined;

  if (databaseConfigured) {
    try {
      matches = await listRankedMatches({ limit: 100 });
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

      <section className="mt-6">
        <div className="mb-3">
          <h1 className="text-lg font-semibold">Ranked matches</h1>
          <p className="mt-1 text-sm text-[#667085]">
            Accept, reject, or keep ambiguous matches for manual review.
          </p>
        </div>
        <MatchTable matches={matches} />
      </section>
    </AppShell>
  );
}
