import { LockKeyhole } from "lucide-react";
import { cn } from "@/lib/ui";

export function LockedPanel({
  authConfigured,
  databaseConfigured,
}: {
  authConfigured: boolean;
  databaseConfigured: boolean;
}) {
  return (
    <section className="panel relative overflow-hidden p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-accent/5 blur-2xl"
      />
      <div className="flex items-start gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-md border border-accent/30 bg-accent/10 text-accent">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="kicker">{"// private instance"}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            Sign in required
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Concert Matchmaker is private. Configure GitHub OAuth and sign in
            with an allowlisted GitHub account to view catalogs, trips, scans,
            and matches.
          </p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md border border-border bg-surface p-3">
              <dt className="microlabel">GitHub auth</dt>
              <dd
                className={cn(
                  "mt-1.5 font-mono text-xs font-semibold",
                  authConfigured ? "text-accent" : "text-danger",
                )}
              >
                {authConfigured ? "configured" : "not configured"}
              </dd>
            </div>
            <div className="rounded-md border border-border bg-surface p-3">
              <dt className="microlabel">Database</dt>
              <dd
                className={cn(
                  "mt-1.5 font-mono text-xs font-semibold",
                  databaseConfigured ? "text-accent" : "text-danger",
                )}
              >
                {databaseConfigured ? "configured" : "not configured"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
