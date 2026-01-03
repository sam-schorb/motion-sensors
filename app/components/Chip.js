export default function Chip({ children, tone = "neutral" }) {
  const className =
    tone === "good"
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900"
      : tone === "bad"
        ? "bg-rose-50 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-900"
        : tone === "warn"
          ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900"
          : "bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${className}`}>
      {children}
    </span>
  );
}

