export default function Loading() {
  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="h-16 rounded-lg border border-border bg-panel" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-lg border border-border bg-panel"
            />
          ))}
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-lg border border-border bg-panel" />
      </div>
    </div>
  );
}
