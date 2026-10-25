"use client";

import { RotateCcw } from "lucide-react";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-foreground">
      <section className="panel w-full max-w-lg p-8 text-center">
        <div className="eq eq--muted mx-auto w-fit" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="kicker mt-5">{"// signal lost"}</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">
          Something failed
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page could not finish loading. Server logs include the detailed
          error.
        </p>
        <button
          type="button"
          onClick={reset}
          className="btn btn-accent mt-6"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Retry
        </button>
      </section>
    </div>
  );
}
