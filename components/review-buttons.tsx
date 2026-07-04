"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Check, X } from "lucide-react";

const actions = [
  { status: "ACCEPTED", label: "Accept", icon: Check },
  { status: "REJECTED", label: "Reject", icon: X },
  { status: "AMBIGUOUS", label: "Ambiguous", icon: AlertTriangle },
];

export function ReviewButtons({ matchId }: { matchId: string }) {
  const router = useRouter();

  async function review(status: string) {
    await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, status }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      {actions.map((action) => (
        <button
          key={action.status}
          type="button"
          onClick={() => review(action.status)}
          className="focus-ring inline-flex size-8 items-center justify-center rounded-md border border-[#d7dce2] bg-white hover:bg-[#f8fafc]"
          title={action.label}
        >
          <action.icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
