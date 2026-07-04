"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radar } from "lucide-react";
import { apiFetchJson } from "@/lib/client-api";

export function TripScanClient({
  tripId,
  catalogId,
}: {
  tripId?: string;
  catalogId?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [pending, setPending] = useState(false);

  async function scan() {
    setPending(true);
    setMessage("");
    try {
      const payload = await apiFetchJson<{
        eventsFetched: number;
        matchesCreated: number;
      }>("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, catalogId }),
      });
      setMessageTone("success");
      setMessage(
        `${payload.eventsFetched} events fetched, ${payload.matchesCreated} new matches created.`,
      );
      router.refresh();
    } catch (caught) {
      setMessageTone("error");
      setMessage(caught instanceof Error ? caught.message : "Scan failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Run event-first scan</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Scans configured providers by date/radius, then matches performers to
            the selected catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={scan}
          disabled={pending || !catalogId}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          <Radar className="size-4" aria-hidden="true" />
          {pending ? "Scanning" : "Scan"}
        </button>
      </div>
      {!catalogId ? (
        <div className="mt-4 text-sm text-warning">
          Import an artist catalog before running a scan.
        </div>
      ) : null}
      {message ? (
        <div
          role={messageTone === "error" ? "alert" : "status"}
          className={
            messageTone === "error"
              ? "mt-4 text-sm text-danger"
              : "mt-4 text-sm text-muted-foreground"
          }
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
