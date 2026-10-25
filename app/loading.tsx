export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="skeleton h-16" />
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-28" />
          ))}
        </div>
        <div className="skeleton mt-6 h-72" />
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
}
