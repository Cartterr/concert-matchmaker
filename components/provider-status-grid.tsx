import { Ban, CheckCircle2, CircleAlert } from "lucide-react";
import type { ProviderHealth } from "@/lib/env";

const iconByStatus = {
  ready: CheckCircle2,
  missing_credentials: CircleAlert,
  disabled: Ban,
};

export function ProviderStatusGrid({ providers }: { providers: ProviderHealth[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {providers.map((provider) => {
        const Icon = iconByStatus[provider.status];
        return (
          <div
            key={provider.key}
            className="rounded-lg border border-border bg-panel p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{provider.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Priority {provider.priority}
                </p>
              </div>
              <Icon
                className={
                  provider.status === "ready"
                    ? "size-5 text-success"
                    : provider.status === "disabled"
                      ? "size-5 text-muted-foreground"
                      : "size-5 text-warning"
                }
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 min-h-10 text-sm text-muted-foreground">
              {provider.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
