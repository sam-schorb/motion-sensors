export default function LogPanel({ title = "Debug log", text }) {
  return (
    <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800">
      <div className="font-medium">{title}</div>
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
        {text || "—"}
      </pre>
    </div>
  );
}

