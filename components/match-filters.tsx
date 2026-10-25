import { Filter } from "lucide-react";
import type { ProviderKey } from "@/lib/env";

const statusOptions = ["PENDING", "AMBIGUOUS", "ACCEPTED", "REJECTED"];
const providerOptions: Array<ProviderKey | "manual" | "manual-confirmed"> = [
  "jambase",
  "ticketmaster",
  "seatgeek",
  "predicthq",
  "manual",
  "manual-confirmed",
];

export type MatchFilterValues = {
  q?: string;
  status?: string;
  provider?: string;
  minConfidence?: string;
};

export function MatchFilters({ values }: { values: MatchFilterValues }) {
  return (
    <form className="panel p-4">
      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        <label className="microlabel">
          Search
          <input
            name="q"
            defaultValue={values.q ?? ""}
            placeholder="artist, event, venue…"
            className="input font-sans normal-case tracking-normal"
          />
        </label>
        <label className="microlabel">
          Status
          <select
            name="status"
            defaultValue={values.status ?? ""}
            className="input font-sans normal-case tracking-normal"
          >
            <option value="">All</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="microlabel">
          Provider
          <select
            name="provider"
            defaultValue={values.provider ?? ""}
            className="input font-sans normal-case tracking-normal"
          >
            <option value="">All</option>
            {providerOptions.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </label>
        <label className="microlabel">
          Min confidence
          <input
            name="minConfidence"
            type="number"
            min="0"
            max="100"
            defaultValue={values.minConfidence ?? ""}
            className="input font-sans normal-case tracking-normal"
          />
        </label>
        <button type="submit" className="btn btn-ghost mt-[26px] h-10">
          <Filter className="size-4" aria-hidden="true" />
          Apply
        </button>
      </div>
    </form>
  );
}
