"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { apiFetchJson } from "@/lib/client-api";

export function ImportForm() {
  const [message, setMessage] = useState<string>("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    try {
      const payload = await apiFetchJson<{
        catalogId: string;
        artistCount: number;
        summary?: {
          parsed: number;
          imported: number;
          dropped: number;
          duplicatesMerged: number;
        };
      }>("/api/catalogs/import", {
        method: "POST",
        body: formData,
      });
      setMessageTone("success");
      setMessage(
        `Imported ${payload.artistCount} artists. ${payload.summary?.duplicatesMerged ?? 0} duplicate rows merged.`,
      );
      formElement.reset();
    } catch (caught) {
      setMessageTone("error");
      setMessage(caught instanceof Error ? caught.message : "Import failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-border bg-panel p-5"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-accent/10 text-accent">
          <Upload className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Import artist catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload the Spotify-derived `liked-artists.csv` or JSON file. Raw exports
            stay local and are not committed.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_2fr]">
        <label className="text-sm font-medium">
          Catalog name
          <input
            name="name"
            defaultValue="Spotify liked artists"
            className="focus-ring mt-2 h-10 w-full rounded-md border border-border px-3"
          />
        </label>
        <label className="text-sm font-medium">
          CSV or JSON file
          <input
            name="file"
            type="file"
            accept=".csv,.json,application/json,text/csv"
            required
            className="focus-ring mt-2 h-10 w-full rounded-md border border-border bg-panel px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          <Upload className="size-4" aria-hidden="true" />
          {pending ? "Importing" : "Import"}
        </button>
        {message ? (
          <span
            role={messageTone === "error" ? "alert" : "status"}
            className={
              messageTone === "error"
                ? "text-sm text-danger"
                : "text-sm text-muted-foreground"
            }
          >
            {message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
