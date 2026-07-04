"use client";

import { useState } from "react";
import { Upload } from "lucide-react";

export function ImportForm() {
  const [message, setMessage] = useState<string>("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/catalogs/import", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as {
      catalogId?: string;
      artistCount?: number;
      error?: string;
    };

    setPending(false);
    setMessage(
      response.ok
        ? `Imported ${payload.artistCount ?? 0} artists into ${payload.catalogId}.`
        : payload.error ?? "Import failed.",
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-[#d7dce2] bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-[#e6f4f1] text-[#0f766e]">
          <Upload className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">Import artist catalog</h1>
          <p className="mt-1 text-sm text-[#667085]">
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
            className="focus-ring mt-2 h-10 w-full rounded-md border border-[#d7dce2] px-3"
          />
        </label>
        <label className="text-sm font-medium">
          CSV or JSON file
          <input
            name="file"
            type="file"
            accept=".csv,.json,application/json,text/csv"
            required
            className="focus-ring mt-2 h-10 w-full rounded-md border border-[#d7dce2] bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-md bg-[#0f766e] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          <Upload className="size-4" aria-hidden="true" />
          {pending ? "Importing" : "Import"}
        </button>
        {message ? <span className="text-sm text-[#475467]">{message}</span> : null}
      </div>
    </form>
  );
}
