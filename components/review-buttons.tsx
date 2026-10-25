"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { apiFetchJson } from "@/lib/client-api";
import { cn } from "@/lib/ui";

const actions = [
  {
    status: "ACCEPTED",
    label: "Accept",
    icon: Check,
    hover: "hover:border-accent/50 hover:bg-accent/10 hover:text-accent",
  },
  {
    status: "REJECTED",
    label: "Reject",
    icon: X,
    hover: "hover:border-danger/50 hover:bg-danger/10 hover:text-danger",
  },
  {
    status: "AMBIGUOUS",
    label: "Ambiguous",
    icon: AlertTriangle,
    hover: "hover:border-magenta/50 hover:bg-magenta/10 hover:text-magenta",
  },
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
        {actions.map((action) => {
          const isPending = pendingStatus === action.status;
          const Icon = isPending ? Loader2 : action.icon;
          return (
            <button
              key={action.status}
              type="button"
              onClick={() => review(action.status)}
              disabled={Boolean(pendingStatus)}
              className={cn(
                "focus-ring inline-flex size-8 items-center justify-center rounded-md border border-border bg-panel text-muted-foreground transition-colors disabled:opacity-60",
                action.hover,
              )}
              title={action.label}
            >
              <Icon
                className={cn("size-4", isPending && "animate-spin")}
                aria-hidden="true"
              />
              <span className="sr-only">
                {isPending ? "Saving" : action.label}
              </span>
            </button>
          );
        })}
      </div>
      {error ? (
        <div role="alert" className="mt-2 max-w-32 text-xs text-danger">
          {error}
        </div>
      ) : null}
    </>
  );
}
