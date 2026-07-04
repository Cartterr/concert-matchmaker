import { LockKeyhole } from "lucide-react";

export function LockedPanel({
  authConfigured,
  databaseConfigured,
}: {
  authConfigured: boolean;
  databaseConfigured: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-panel p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-muted text-foreground">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Sign in required</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Concert Matchmaker is private. Configure GitHub OAuth and sign in with
            an allowlisted GitHub account to view catalogs, trips, scans, and
            matches.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <dt className="text-muted-foreground">GitHub auth</dt>
              <dd className="mt-1 font-medium">
                {authConfigured ? "Configured" : "Not configured"}
              </dd>
            </div>
            <div className="rounded-md border border-border p-3">
              <dt className="text-muted-foreground">Database</dt>
              <dd className="mt-1 font-medium">
                {databaseConfigured ? "Configured" : "Not configured"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
