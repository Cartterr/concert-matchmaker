"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { apiFetchJson } from "@/lib/client-api";
import { cn } from "@/lib/ui";

export function ManualEventForm({
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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    function optionalNumber(value: FormDataEntryValue | null) {
      const text = String(value ?? "").trim();
      if (!text) return undefined;
      const number = Number(text);
      return Number.isFinite(number) ? number : undefined;
    }

    try {
      const payload = await apiFetchJson<{ matchesCreated: number }>(
        "/api/manual-events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.get("title"),
            startAt: form.get("startAt") || undefined,
            venueName: form.get("venueName"),
            latitude: optionalNumber(form.get("latitude")),
            longitude: optionalNumber(form.get("longitude")),
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
        },
      );
      setMessageTone("success");
      setMessage(`Manual event saved with ${payload.matchesCreated} new matches.`);
      formElement.reset();
      router.refresh();
    } catch (caught) {
      setMessageTone("error");
      setMessage(caught instanceof Error ? caught.message : "Manual import failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md border border-magenta/30 bg-magenta/10 text-magenta">
          <Plus className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Manual event fallback
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add DICE, RA, venue, or platform gaps without scraping.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Event title
          <input name="title" required className="input" />
        </label>
        <label className="text-sm font-medium">
          Start time
          <input name="startAt" type="datetime-local" className="input" />
        </label>
        <label className="text-sm font-medium">
          Venue
          <input name="venueName" required className="input" />
        </label>
        <label className="text-sm font-medium">
          Performers
          <input
            name="performers"
            placeholder="Artist One, Artist Two"
            className="input"
          />
        </label>
        <label className="text-sm font-medium">
          Latitude
          <input
            name="latitude"
            type="number"
            step="any"
            placeholder="34.0407"
            className="input"
          />
        </label>
        <label className="text-sm font-medium">
          Longitude
          <input
            name="longitude"
            type="number"
            step="any"
            placeholder="-118.2690"
            className="input"
          />
        </label>
        <label className="text-sm font-medium">
          Provider URL
          <input name="providerUrl" type="url" className="input" />
        </label>
        <label className="text-sm font-medium">
          Ticket URL
          <input name="ticketUrl" type="url" className="input" />
        </label>
      </div>
      <label className="mt-4 block text-sm font-medium">
        Source note
        <textarea
          name="sourceNote"
          rows={3}
          className="input h-auto py-2"
        />
      </label>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !catalogId}
          className="btn btn-ghost"
        >
          <Plus className="size-4" aria-hidden="true" />
          {pending ? "Saving…" : "Add event"}
        </button>
        {message ? (
          <span
            role={messageTone === "error" ? "alert" : "status"}
            className={cn(
              "font-mono text-xs",
              messageTone === "error" ? "text-danger" : "text-accent",
            )}
          >
            » {message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
