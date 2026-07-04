"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <section className="w-full max-w-lg rounded-lg border border-border bg-panel p-6">
        <h1 className="text-lg font-semibold">Something failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page could not finish loading. Server logs include the detailed error.
        </p>
        <button
          type="button"
          onClick={reset}
          className="focus-ring mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-sidebar px-4 text-sm font-medium text-sidebar-foreground"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Retry
        </button>
      </section>
    </div>
  );
}
