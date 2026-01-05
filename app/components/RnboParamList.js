import { deriveSliderStep, fmtNumber } from "@/lib/rnbo/params";
import Chip from "@/app/components/Chip";

export default function RnboParamList({ params, onChange }) {
  if (!params?.list?.length) {
    return (
      <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        No parameters loaded yet.
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-3">
      {params.list.map((p) => (
        <div
          key={p.id}
          className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {p.displayName}
                </div>
                <Chip tone={p.connected ? "good" : "warn"}>
                  {p.connected ? "connected" : "missing"}
                </Chip>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {p.id}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {p.type} • min={p.min} max={p.max} steps={p.steps || 0}
                {p.exponent && p.exponent !== 1 ? ` exp=${p.exponent}` : ""}
                {p.unit ? ` • unit=${p.unit}` : ""}
              </div>
            </div>

            <div className="shrink-0 text-right font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
              {p.value == null ? "—" : `${fmtNumber(p.value)}${p.unit ? ` ${p.unit}` : ""}`}
            </div>
          </div>

          <div className="mt-3 grid items-center gap-3 sm:grid-cols-[1fr_5rem]">
            <input
              type="range"
              min={String(p.min)}
              max={String(p.max)}
              step={String(deriveSliderStep(p.min, p.max, p.steps))}
              value={String(p.value ?? p.initialValue ?? p.min ?? 0)}
              disabled={!p.connected}
              onChange={(e) => onChange?.(p.id, Number(e.target.value))}
              className="w-full"
            />
            <div className="text-right font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {p.value == null ? "—" : fmtNumber(p.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

