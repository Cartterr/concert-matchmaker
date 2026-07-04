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
            className="rounded-lg border border-[#d7dce2] bg-white p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{provider.name}</h3>
                <p className="mt-1 text-xs text-[#667085]">Priority {provider.priority}</p>
              </div>
              <Icon
                className={
                  provider.status === "ready"
                    ? "size-5 text-[#0f766e]"
                    : provider.status === "disabled"
                      ? "size-5 text-[#667085]"
                      : "size-5 text-[#b45309]"
                }
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 min-h-10 text-sm text-[#475467]">{provider.message}</p>
          </div>
        );
      })}
    </div>
  );
}
