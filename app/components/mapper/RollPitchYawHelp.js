export default function RollPitchYawHelp() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
        Roll / Pitch / Yaw (what they mean)
      </div>
      <div className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <div>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Roll
          </span>
          : tilt the phone left/right like turning a steering wheel.
        </div>
        <div>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Pitch
          </span>
          : tilt the phone forward/back like nodding.
        </div>
        <div>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            Yaw
          </span>
          : rotate left/right like looking left/right (turning around a vertical axis).
        </div>
        <div className="pt-2 text-xs">
          Mapping is relative-from-start: when you press “Recalibrate”, the current orientation becomes the new “zero”.
        </div>
      </div>
    </div>
  );
}

