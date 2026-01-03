"use client";

import { useEffect, useRef, useState } from "react";
import SensorCard from "@/app/components/SensorCard";
import SensorOverview from "@/app/components/SensorOverview";
import { SENSOR_DEFS } from "@/lib/sensors/defs";
import { createSensorController } from "@/lib/sensors/controller";

export default function SensorDashboard() {
  const controllerRef = useRef(null);

  const [rows, setRows] = useState({});
  const [env, setEnv] = useState(null);

  useEffect(() => {
    const controller = createSensorController({
      defs: SENSOR_DEFS,
      onRowUpdate: (id, patch) => {
        setRows((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            ...patch,
          },
        }));
      },
    });

    controllerRef.current = controller;
    let cancelled = false;
    setTimeout(() => {
      if (cancelled) return;
      setEnv(controller.getEnv());
      setRows(controller.getInitialRows());
    }, 0);

    return () => {
      cancelled = true;
      controller.destroy();
    };
  }, []);

  const motion = SENSOR_DEFS.filter((d) => d.category === "Motion");
  const orientation = SENSOR_DEFS.filter((d) => d.category === "Orientation");
  const location = SENSOR_DEFS.filter((d) => d.category === "Location");

  const onStartAll = () => controllerRef.current?.startAll();
  const onStopAll = () => controllerRef.current?.stopAll();
  const onStartOne = (id) => controllerRef.current?.start(id);
  const onStopOne = (id) => controllerRef.current?.stop(id);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Motion + Orientation + Location Sensors (Web)
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            This page starts the browser sensor APIs that map most closely to the Android and iOS motion frameworks and
            shows live readings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStartAll}
            className="inline-flex h-10 items-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Start all
          </button>
          <button
            type="button"
            onClick={onStopAll}
            className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Stop all
          </button>
        </div>
      </div>

      {env?.isSecureContext === false ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          <div className="font-semibold">Not a secure context</div>
          <div className="mt-1">
            Many sensor APIs require HTTPS. Localhost is usually OK, but loading this site over plain HTTP on a phone will
            often block sensors.
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <div className="font-semibold">Important constraints</div>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Most sensor APIs require HTTPS (secure context) on a real device.</li>
          <li>Some browsers gate motion/orientation behind a user permission prompt.</li>
          <li>On iOS, sensor access often requires a user gesture—use “Start all”.</li>
        </ul>
      </div>

      {env ? (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Environment</div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 p-3 text-xs ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <div className="font-medium">Secure context</div>
              <div className="mt-1 font-mono text-[11px]">{String(env.isSecureContext)}</div>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 text-xs ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <div className="font-medium">User agent</div>
              <div className="mt-1 break-words font-mono text-[11px]">{env.userAgent || "—"}</div>
            </div>
          </div>
        </div>
      ) : null}

      <SensorOverview defs={SENSOR_DEFS} rows={rows} />

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Motion</h2>
        <div className="mt-3 grid gap-4">
          {motion.map((def) => (
            <SensorCard
              key={def.id}
              def={def}
              row={rows[def.id] || { status: "idle", supported: false }}
              onStart={onStartOne}
              onStop={onStopOne}
              canStop={rows[def.id]?.status === "running" || rows[def.id]?.status === "starting"}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Orientation</h2>
        <div className="mt-3 grid gap-4">
          {orientation.map((def) => (
            <SensorCard
              key={def.id}
              def={def}
              row={rows[def.id] || { status: "idle", supported: false }}
              onStart={onStartOne}
              onStop={onStopOne}
              canStop={rows[def.id]?.status === "running" || rows[def.id]?.status === "starting"}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Location</h2>
        <div className="mt-3 grid gap-4">
          {location.map((def) => (
            <SensorCard
              key={def.id}
              def={def}
              row={rows[def.id] || { status: "idle", supported: false }}
              onStart={onStartOne}
              onStop={onStopOne}
              canStop={rows[def.id]?.status === "running" || rows[def.id]?.status === "starting"}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
