export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  const isNumber = typeof value === "number";

  return (
    <div className="panel panel-hover group relative overflow-hidden p-4">
      <div
        aria-hidden="true"
        className="absolute right-3 top-3 font-mono text-[10px] text-faint transition-colors group-hover:text-accent"
      >
        +
      </div>
      <div className="microlabel">{label}</div>
      <div
        title={String(value)}
        className={
          isNumber
            ? "mt-2 truncate font-mono text-3xl font-semibold tabular-nums"
            : "mt-2 truncate text-base font-semibold"
        }
      >
        {isNumber ? value.toLocaleString("en-US") : value}
      </div>
      {detail ? (
        <div className="mt-1 truncate text-sm text-muted-foreground">
          {detail}
        </div>
      ) : null}
    </div>
  );
}
