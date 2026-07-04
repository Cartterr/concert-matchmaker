export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-[#d7dce2] bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-[#667085]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {detail ? <div className="mt-1 text-sm text-[#667085]">{detail}</div> : null}
    </div>
  );
}
