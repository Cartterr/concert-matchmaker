"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radar } from "lucide-react";

export function TripScanClient({
  tripId,
  catalogId,
}: {
  tripId?: string;
  catalogId?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function scan() {
    setPending(true);
    setMessage("");
    const response = await fetch("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripId, catalogId }),
    });
    const payload = (await response.json()) as {
      eventsFetched?: number;
      matchesCreated?: number;
      error?: string;
    };
    setPending(false);
    setMessage(
      response.ok
        ? `${payload.eventsFetched ?? 0} events fetched, ${payload.matchesCreated ?? 0} matches created.`
        : payload.error ?? "Scan failed.",
    );
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-[#d7dce2] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Run event-first scan</h2>
          <p className="mt-1 text-sm text-[#667085]">
            Scans configured providers by date/radius, then matches performers to
            the selected catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={scan}
          disabled={pending}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-[#0f766e] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          <Radar className="size-4" aria-hidden="true" />
          {pending ? "Scanning" : "Scan"}
        </button>
      </div>
      {message ? <div className="mt-4 text-sm text-[#475467]">{message}</div> : null}
    </div>
  );
}
