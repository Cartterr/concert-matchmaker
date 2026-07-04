import { Filter } from "lucide-react";
import type { ProviderKey } from "@/lib/env";

const statusOptions = ["PENDING", "AMBIGUOUS", "ACCEPTED", "REJECTED"];
const providerOptions: Array<ProviderKey | "manual"> = [
  "jambase",
  "ticketmaster",
  "seatgeek",
  "predicthq",
  "manual",
];

export type MatchFilterValues = {
  q?: string;
  status?: string;
  provider?: string;
  minConfidence?: string;
};

export function MatchFilters({ values }: { values: MatchFilterValues }) {
  return (
    <form className="rounded-lg border border-border bg-panel p-4">
      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        <label className="text-sm font-medium">
          Search
          <input
            name="q"
            defaultValue={values.q ?? ""}
            placeholder="Artist, event, venue"
            className="focus-ring mt-2 h-10 w-full rounded-md border border-border px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Status
          <select
            name="status"
            defaultValue={values.status ?? ""}
            className="focus-ring mt-2 h-10 w-full rounded-md border border-border bg-panel px-3"
          >
            <option value="">All</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Provider
          <select
            name="provider"
            defaultValue={values.provider ?? ""}
            className="focus-ring mt-2 h-10 w-full rounded-md border border-border bg-panel px-3"
          >
            <option value="">All</option>
            {providerOptions.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Min confidence
          <input
            name="minConfidence"
            type="number"
            min="0"
            max="100"
            defaultValue={values.minConfidence ?? ""}
            className="focus-ring mt-2 h-10 w-full rounded-md border border-border px-3"
          />
        </label>
        <button
          type="submit"
          className="focus-ring mt-7 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-sidebar px-4 text-sm font-medium text-sidebar-foreground"
        >
          <Filter className="size-4" aria-hidden="true" />
          Apply
        </button>
      </div>
    </form>
  );
}
