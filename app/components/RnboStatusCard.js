import LogPanel from "@/app/components/LogPanel";
import Chip from "@/app/components/Chip";

function toneFor(status) {
  if (status === "running" || status === "loaded" || status === "ready") return "good";
  if (status === "error") return "bad";
  if (status === "loading" || status === "creating" || status === "created") return "warn";
  return "neutral";
}

export default function RnboStatusCard({ state, logText, onStart, onStop, isStarting }) {
  const rnboTone = toneFor(state?.rnbo?.status);
  const audioTone = toneFor(state?.audio?.status);
  const deviceTone = toneFor(state?.device?.status);

  return (
    <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">RNBO Synth</div>
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Patch: <span className="font-mono text-[11px]">{state?.patcher?.url || "—"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStart}
            disabled={isStarting}
            className="inline-flex h-10 items-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start audio
          </button>
          <button
            type="button"
            onClick={onStop}
            className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Stop audio
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-lg bg-zinc-50 p-3 text-xs ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="flex items-center justify-between">
            <div className="font-medium">Secure context</div>
            <Chip tone={state?.isSecureContext ? "good" : "warn"}>{String(state?.isSecureContext)}</Chip>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            User agent:{" "}
            <span className="break-words font-mono">{state?.userAgent || "—"}</span>
          </div>
        </div>

        <div className="rounded-lg bg-zinc-50 p-3 text-xs ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">RNBO.js</div>
              <Chip tone={rnboTone}>{state?.rnbo?.status || "—"}</Chip>
            </div>
            <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {state?.rnbo?.version ? `v${state.rnbo.version}` : "—"}
            </div>

            <div className="flex items-center justify-between">
              <div className="font-medium">AudioContext</div>
              <Chip tone={audioTone}>{state?.audio?.state || state?.audio?.status || "—"}</Chip>
            </div>
            <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {state?.audio?.sampleRate ? `sampleRate=${state.audio.sampleRate}` : "—"}
            </div>

            <div className="flex items-center justify-between">
              <div className="font-medium">Device</div>
              <Chip tone={deviceTone}>{state?.device?.status || "—"}</Chip>
            </div>
            <div className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {state?.patcher?.rnboVersion ? `export rnbo v${state.patcher.rnboVersion}` : "—"}
            </div>
          </div>
        </div>
      </div>

      {state?.error ? (
        <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-900 ring-1 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-900">
          <div className="font-medium">Error</div>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
            {JSON.stringify(state.error, null, 2)}
          </pre>
        </div>
      ) : null}

      <LogPanel title="RNBO debug log" text={logText} />
    </div>
  );
}

