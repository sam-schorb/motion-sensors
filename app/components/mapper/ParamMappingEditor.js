import Chip from "@/app/components/Chip";
import { CONTROL_SOURCES } from "@/lib/motionMapper/mappingEngine";

function getSourceLabel(id) {
  return CONTROL_SOURCES.find((s) => s.id === id)?.label || id;
}

export default function ParamMappingEditor({
  params,
  mapping,
  onChange,
}) {
  if (!params?.length) {
    return (
      <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Load a patch to see its parameters.
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      {params.map((p) => {
        const spec = mapping?.[p.paramId] || { source: "none", invert: false };
        const has = Boolean(spec?.source && spec.source !== "none");

        return (
          <div
            key={p.paramId}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {p.displayName || p.name || p.paramId}
                  </div>
                  <Chip tone={has ? "good" : "neutral"}>{getSourceLabel(spec.source || "none")}</Chip>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {p.paramId}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  min={p.minimum} max={p.maximum} steps={p.steps || 0}
                  {p.exponent && p.exponent !== 1 ? ` exp=${p.exponent}` : ""}
                  {p.unit ? ` • unit=${p.unit}` : ""}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Map to</span>
                  <select
                    className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    value={spec.source || "none"}
                    onChange={(e) =>
                      onChange?.(p.paramId, {
                        ...spec,
                        source: e.target.value,
                      })
                    }
                  >
                    {CONTROL_SOURCES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={Boolean(spec.invert)}
                    onChange={(e) =>
                      onChange?.(p.paramId, {
                        ...spec,
                        invert: e.target.checked,
                      })
                    }
                  />
                  <span>Invert</span>
                </label>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

