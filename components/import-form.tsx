"use client";

import { useState } from "react";
import { FileAudio, Upload } from "lucide-react";
import { apiFetchJson } from "@/lib/client-api";
import { cn } from "@/lib/ui";

export function ImportForm() {
  const [message, setMessage] = useState<string>("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

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
      setFileName("");
    } catch (caught) {
      setMessageTone("error");
      setMessage(caught instanceof Error ? caught.message : "Import failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 place-items-center rounded-md border border-accent/30 bg-accent/10 text-accent">
          <Upload className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Import artist catalog
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload the Spotify-derived `liked-artists.csv` or JSON file. Raw
            exports stay local and are not committed.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_2fr]">
        <label className="text-sm font-medium">
          Catalog name
          <input
            name="name"
            defaultValue="Spotify liked artists"
            className="input"
          />
        </label>
        <div className="text-sm font-medium">
          CSV or JSON file
          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={() => setDragging(false)}
            className={cn(
              "relative mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 py-4 text-center transition-colors",
              dragging
                ? "border-accent bg-accent/10"
                : fileName
                  ? "border-accent/50 bg-accent/5"
                  : "border-border-strong bg-surface hover:border-accent/50 hover:bg-accent/5",
            )}
          >
            <input
              name="file"
              type="file"
              accept=".csv,.json,application/json,text/csv"
              required
              onChange={(event) =>
                setFileName(event.currentTarget.files?.[0]?.name ?? "")
              }
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="CSV or JSON file"
            />
            <FileAudio
              className={cn(
                "size-5",
                fileName ? "text-accent" : "text-faint",
              )}
              aria-hidden="true"
            />
            {fileName ? (
              <span className="font-mono text-xs text-accent">{fileName}</span>
            ) : (
              <>
                <span className="text-sm text-muted-foreground">
                  Drop file here or click to browse
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  csv · json
                </span>
              </>
            )}
          </label>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-accent">
          <Upload className="size-4" aria-hidden="true" />
          {pending ? "Importing…" : "Import"}
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
