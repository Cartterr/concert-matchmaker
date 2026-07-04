"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Check, X } from "lucide-react";
import { useState } from "react";
import { apiFetchJson } from "@/lib/client-api";

const actions = [
  { status: "ACCEPTED", label: "Accept", icon: Check },
  { status: "REJECTED", label: "Reject", icon: X },
  { status: "AMBIGUOUS", label: "Ambiguous", icon: AlertTriangle },
];

export function ReviewButtons({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function review(status: string) {
    setPendingStatus(status);
    setError("");
    try {
      await apiFetchJson("/api/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, status }),
      });
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review failed.");
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <>
      <div className="flex gap-1">
        {actions.map((action) => (
          <button
            key={action.status}
            type="button"
            onClick={() => review(action.status)}
            disabled={Boolean(pendingStatus)}
            className="focus-ring inline-flex size-8 items-center justify-center rounded-md border border-border bg-panel hover:bg-muted disabled:opacity-60"
            title={action.label}
          >
            <action.icon className="size-4" aria-hidden="true" />
            <span className="sr-only">
              {pendingStatus === action.status ? "Saving" : action.label}
            </span>
          </button>
        ))}
      </div>
      {error ? (
        <div role="alert" className="mt-2 max-w-32 text-xs text-danger">
          {error}
        </div>
      ) : null}
    </>
  );
}
