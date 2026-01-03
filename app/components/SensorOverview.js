import Chip from "@/app/components/Chip";

function getToneForRow(row) {
  if (row.status === "running") return "good";
  if (row.status === "error") return "bad";
  if (row.status === "unavailable") return "warn";
  if (row.supported) return "neutral";
  return "warn";
}

function getLabelForRow(row) {
  if (row.status === "running") return "running";
  if (row.status === "error") return "error";
  if (row.status === "unavailable") return "unavailable";
  if (row.supported) return "ready";
  return "unsupported";
}

export default function SensorOverview({ defs, rows }) {
  const running = defs.filter((d) => rows[d.id]?.status === "running").length;
  const errors = defs.filter((d) => rows[d.id]?.status === "error").length;
  const unavailable = defs.filter((d) => rows[d.id]?.status === "unavailable").length;

  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-semibold text-zinc-900 dark:text-zinc-100">Overview</div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="good">{running} running</Chip>
          <Chip tone="bad">{errors} errors</Chip>
          <Chip tone="warn">{unavailable} unavailable</Chip>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {defs.map((def) => {
          const row = rows[def.id] || { status: "idle", supported: false };
          const tone = getToneForRow(row);
          const label = getLabelForRow(row);

          return (
            <a
              key={def.id}
              href={`#sensor-${def.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              <Chip tone={tone}>{label}</Chip>
              <span className="max-w-[18rem] truncate">{def.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

