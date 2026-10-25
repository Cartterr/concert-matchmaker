"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radar } from "lucide-react";
import { apiFetchJson } from "@/lib/client-api";
import { cn } from "@/lib/ui";

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
    <div className={cn("panel p-5", pending && "scan-sweep border-accent/30")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Run event-first scan
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Scans configured providers by date/radius, then matches performers
            to the selected catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={scan}
          disabled={pending || !catalogId}
          className="btn btn-accent"
        >
          <Radar
            className={cn("size-4", pending && "animate-spin [animation-duration:1.8s]")}
            aria-hidden="true"
          />
          {pending ? "Scanning…" : "Scan"}
        </button>
      </div>
      {!catalogId ? (
        <div className="mt-4 font-mono text-xs text-warning">
          » Import an artist catalog before running a scan.
        </div>
      ) : null}
      {pending ? (
        <div
          role="status"
          className="mt-4 font-mono text-xs text-accent"
          aria-live="polite"
        >
          » sweeping providers · normalizing events · scoring performers
        </div>
      ) : null}
      {message ? (
        <div
          role={messageTone === "error" ? "alert" : "status"}
          className={cn(
            "mt-4 font-mono text-xs",
            messageTone === "error" ? "text-danger" : "text-accent",
          )}
        >
          » {message}
        </div>
      ) : null}
    </div>
  );
}
