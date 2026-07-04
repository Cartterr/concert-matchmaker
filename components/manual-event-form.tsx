"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export function ManualEventForm({
  tripId,
  catalogId,
}: {
  tripId?: string;
  catalogId?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/manual-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        startAt: form.get("startAt") || undefined,
        venueName: form.get("venueName"),
        performers: String(form.get("performers") ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        providerUrl: form.get("providerUrl") || undefined,
        ticketUrl: form.get("ticketUrl") || undefined,
        sourceNote: form.get("sourceNote") || undefined,
        tripId,
        catalogId,
      }),
    });
    const payload = (await response.json()) as {
      matchesCreated?: number;
      error?: string;
    };
    setPending(false);
    setMessage(
      response.ok
        ? `Manual event saved with ${payload.matchesCreated ?? 0} matches.`
        : payload.error ?? "Manual import failed.",
    );
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-[#d7dce2] bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-[#eef1f4]">
          <Plus className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Manual event fallback</h2>
          <p className="mt-1 text-sm text-[#667085]">
            Add DICE, RA, venue, or platform gaps without scraping.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Event title
          <input
            name="title"
            required
            className="focus-ring mt-2 h-10 w-full rounded-md border border-[#d7dce2] px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Start time
          <input
            name="startAt"
            type="datetime-local"
            className="focus-ring mt-2 h-10 w-full rounded-md border border-[#d7dce2] px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Venue
          <input
            name="venueName"
            required
            className="focus-ring mt-2 h-10 w-full rounded-md border border-[#d7dce2] px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Performers
          <input
            name="performers"
            placeholder="Artist One, Artist Two"
            className="focus-ring mt-2 h-10 w-full rounded-md border border-[#d7dce2] px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Provider URL
          <input
            name="providerUrl"
            type="url"
            className="focus-ring mt-2 h-10 w-full rounded-md border border-[#d7dce2] px-3"
          />
        </label>
        <label className="text-sm font-medium">
          Ticket URL
          <input
            name="ticketUrl"
            type="url"
            className="focus-ring mt-2 h-10 w-full rounded-md border border-[#d7dce2] px-3"
          />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium">
        Source note
        <textarea
          name="sourceNote"
          rows={3}
          className="focus-ring mt-2 w-full rounded-md border border-[#d7dce2] px-3 py-2"
        />
      </label>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-[#111827] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          <Plus className="size-4" aria-hidden="true" />
          {pending ? "Saving" : "Add event"}
        </button>
        {message ? <span className="text-sm text-[#475467]">{message}</span> : null}
      </div>
    </form>
  );
}
