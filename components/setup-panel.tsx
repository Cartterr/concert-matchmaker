import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/ui";

export function SetupPanel({
  authConfigured,
  databaseConfigured,
  error,
}: {
  authConfigured: boolean;
  databaseConfigured: boolean;
  error?: string;
}) {
  const items = [
    {
      label: "Postgres DATABASE_URL",
      ready: databaseConfigured,
      detail: "Railway Postgres or local Postgres connection string.",
    },
    {
      label: "GitHub OAuth allowlist",
      ready: authConfigured,
      detail: "AUTH_SECRET, AUTH_URL, GITHUB_ID, GITHUB_SECRET, and allowlist vars.",
    },
  ];

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md border border-warning/30 bg-warning/10 text-warning">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Environment setup required
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            The app is scaffolded, but live data pages need the database and
            GitHub OAuth environment variables from `.env.example`.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-border bg-surface p-4"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2
                className={cn(
                  "size-4",
                  item.ready ? "text-accent" : "text-faint",
                )}
                aria-hidden="true"
              />
              {item.label}
              <span
                className={cn(
                  "badge ml-auto",
                  item.ready
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-border bg-muted text-muted-foreground",
                )}
              >
                {item.ready ? "ok" : "missing"}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
      {error ? (
        <pre className="mt-4 overflow-auto rounded-md border border-border bg-surface p-3 font-mono text-xs text-warning">
          {sanitizeSetupError(error)}
        </pre>
      ) : null}
    </section>
  );
}

function sanitizeSetupError(error: string) {
  if (/database|prisma|connect|econnrefused|timeout/i.test(error)) {
    return "Database connection failed. Check DATABASE_URL and run migrations.";
  }
  return "Setup check failed. Review the server logs for details.";
}
