import Chip from "@/app/components/Chip";

function formatValue(value) {
  return JSON.stringify(value, null, 2);
}

export default function SensorCard({ def, row, onStart, onStop, canStop }) {
  const isRunning = row.status === "running" || row.status === "starting";
  const supported = row.supported;

  const tone =
    row.status === "running"
      ? "good"
      : row.status === "error"
        ? "bad"
        : row.status === "unavailable"
          ? "warn"
          : supported
            ? "neutral"
            : "warn";

  const statusLabel =
    row.status === "running"
      ? "running"
      : row.status === "starting"
        ? "starting"
        : row.status === "stopped"
          ? "stopped"
          : row.status === "error"
            ? "error"
            : row.status === "unavailable"
              ? "unavailable"
              : supported
                ? "ready"
                : "unsupported";

  return (
    <div
      id={`sensor-${def.id}`}
      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">{def.label}</div>
            <Chip tone={tone}>{statusLabel}</Chip>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{def.id}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            {row.strategy
              ? `Using: ${row.strategy}`
              : `Strategies: ${def.strategies.map((s) => s.label).join(" • ")}`}
          </div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Android:</span> {def.android || "—"}{" "}
            <span className="mx-1">•</span> <span className="font-medium text-zinc-700 dark:text-zinc-300">iOS:</span>{" "}
            {def.ios || "—"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onStart(def.id)}
            disabled={!supported || isRunning}
            className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => onStop(def.id)}
            disabled={!canStop}
            className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-100"
          >
            Stop
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800">
          <div className="flex items-center justify-between">
            <div className="font-medium">Latest reading</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{row.lastUpdatedAt || "—"}</div>
          </div>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
            {row.reading ? formatValue(row.reading) : "—"}
          </pre>
        </div>

        <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800">
          <div className="font-medium">Errors</div>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
            {row.error ? formatValue(row.error) : "—"}
          </pre>
        </div>
      </div>
    </div>
  );
}

