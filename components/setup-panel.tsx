import { AlertTriangle, CheckCircle2 } from "lucide-react";

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
    <section className="rounded-lg border border-[#d7dce2] bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 text-[#b45309]" aria-hidden="true" />
        <div>
          <h1 className="text-lg font-semibold">Environment setup required</h1>
          <p className="mt-1 max-w-3xl text-sm text-[#667085]">
            The app is scaffolded, but live data pages need the database and GitHub
            OAuth environment variables from `.env.example`.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-md border border-[#d7dce2] p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2
                className={item.ready ? "size-4 text-[#0f766e]" : "size-4 text-[#98a2b3]"}
                aria-hidden="true"
              />
              {item.label}
            </div>
            <p className="mt-2 text-sm text-[#667085]">{item.detail}</p>
          </div>
        ))}
      </div>
      {error ? (
        <pre className="mt-4 overflow-auto rounded-md bg-[#111827] p-3 text-xs text-white">
          {error}
        </pre>
      ) : null}
    </section>
  );
}
