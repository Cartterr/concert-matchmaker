import type { ProviderHealth } from "@/lib/env";
import { cn } from "@/lib/ui";

const statusMeta: Record<
  ProviderHealth["status"],
  { label: string; dot: string; badge: string }
> = {
  ready: {
    label: "ready",
    dot: "bg-accent status-dot--pulse",
    badge: "border-accent/30 bg-accent/10 text-accent",
  },
  missing_credentials: {
    label: "skipped",
    dot: "bg-warning",
    badge: "border-warning/30 bg-warning/10 text-warning",
  },
  disabled: {
    label: "off",
    dot: "bg-faint",
    badge: "border-border bg-muted text-muted-foreground",
  },
};

export function ProviderStatusGrid({ providers }: { providers: ProviderHealth[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
      {providers.map((provider) => {
        const meta = statusMeta[provider.status];
        return (
          <div key={provider.key} className="panel panel-hover p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={cn("status-dot", meta.dot)} aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold">{provider.name}</h3>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                    p{provider.priority} · {provider.key}
                  </p>
                </div>
              </div>
              <span className={cn("badge", meta.badge)}>{meta.label}</span>
            </div>
            <p className="mt-3 min-h-10 text-sm text-muted-foreground">
              {provider.message}
            </p>
            {provider.status === "missing_credentials" ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {provider.requiredEnv.map((envName) => (
                  <code
                    key={envName}
                    className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-warning"
                  >
                    {envName}
                  </code>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
