'use client';

import { useEffect, useRef, useState } from 'react';
import SensorCard from '@/app/components/SensorCard';
import SensorOverview from '@/app/components/SensorOverview';
import RnboStatusCard from '@/app/components/RnboStatusCard';
import RnboParamList from '@/app/components/RnboParamList';
import { createSensorController } from '@/lib/sensors/controller';
import { SENSOR_DEFS } from '@/lib/sensors/defs';
import { createRnboController } from '@/lib/rnbo/controller';

function prependLog(prev, line) {
  const next = `${line}\n${prev || ''}`;
  return next.slice(0, 40_000);
}

export default function RnboMotionDashboard() {
  const sensorControllerRef = useRef(null);
  const rnboControllerRef = useRef(null);

  const [rows, setRows] = useState({});
  const [env, setEnv] = useState(null);

  const [rnboState, setRnboState] = useState(null);
  const [rnboLog, setRnboLog] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const sensorController = createSensorController({
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
    sensorControllerRef.current = sensorController;

    const rnboController = createRnboController({
      patcherUrl: '/motionSense1/motionSense1.export.json',
      onStateUpdate: (next) => setRnboState(next),
      onLog: (line) => setRnboLog((prev) => prependLog(prev, line)),
    });
    rnboControllerRef.current = rnboController;

    let cancelled = false;
    setTimeout(() => {
      if (cancelled) return;
      setEnv(sensorController.getEnv());
      setRows(sensorController.getInitialRows());
      setRnboState(rnboController.getState());
    }, 0);

    return () => {
      cancelled = true;
      sensorController.destroy();
      rnboController.destroy();
    };
  }, []);

  const motion = SENSOR_DEFS.filter((d) => d.category === 'Motion');
  const orientation = SENSOR_DEFS.filter((d) => d.category === 'Orientation');
  const location = SENSOR_DEFS.filter((d) => d.category === 'Location');

  const onStartAllSensors = () => sensorControllerRef.current?.startAll();
  const onStopAllSensors = () => sensorControllerRef.current?.stopAll();
  const onStartOne = (id) => sensorControllerRef.current?.start(id);
  const onStopOne = (id) => sensorControllerRef.current?.stop(id);

  const onStartAudio = async () => {
    const rnbo = rnboControllerRef.current;
    if (!rnbo) return;
    setIsStarting(true);
    try {
      // Kick off sensor permissions immediately while we spin up the audio + patch.
      const sensorPromise = sensorControllerRef.current?.startAll();
      await rnbo.start();
      await sensorPromise;
    } finally {
      setIsStarting(false);
    }
  };

  const onStopAudio = async () => {
    await rnboControllerRef.current?.stopAudio();
  };

  const onParamChange = (paramId, value) => {
    rnboControllerRef.current?.setParamValue(paramId, value);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Motion + RNBO
          </h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Start audio to load the RNBO synth and start the motion/orientation sensors.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onStartAllSensors}
            className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start sensors
          </button>
          <button
            type="button"
            onClick={onStopAllSensors}
            className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Stop sensors
          </button>
        </div>
      </div>

      {env?.isSecureContext === false ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
          <div className="font-semibold">Not a secure context</div>
          <div className="mt-1">
            Many sensor and audio APIs require HTTPS. Localhost is usually OK,
            but loading this site over plain HTTP on a phone will often block
            sensors.
          </div>
        </div>
      ) : null}

      <RnboStatusCard
        state={rnboState}
        logText={rnboLog}
        onStart={onStartAudio}
        onStop={onStopAudio}
        isStarting={isStarting}
      />

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          RNBO parameters
        </h2>
        <RnboParamList params={rnboState?.params} onChange={onParamChange} />
      </section>

      {env ? (
        <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
            Environment
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 p-3 text-xs ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <div className="font-medium">Secure context</div>
              <div className="mt-1 font-mono text-[11px]">
                {String(env.isSecureContext)}
              </div>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 text-xs ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
              <div className="font-medium">User agent</div>
              <div className="mt-1 break-words font-mono text-[11px]">
                {env.userAgent || '—'}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <SensorOverview defs={SENSOR_DEFS} rows={rows} />

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Motion
        </h2>
        <div className="mt-3 grid gap-4">
          {motion.map((def) => (
            <SensorCard
              key={def.id}
              def={def}
              row={rows[def.id] || { status: 'idle', supported: false }}
              onStart={onStartOne}
              onStop={onStopOne}
              canStop={
                rows[def.id]?.status === 'running' ||
                rows[def.id]?.status === 'starting'
              }
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Orientation
        </h2>
        <div className="mt-3 grid gap-4">
          {orientation.map((def) => (
            <SensorCard
              key={def.id}
              def={def}
              row={rows[def.id] || { status: 'idle', supported: false }}
              onStart={onStartOne}
              onStop={onStopOne}
              canStop={
                rows[def.id]?.status === 'running' ||
                rows[def.id]?.status === 'starting'
              }
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Location
        </h2>
        <div className="mt-3 grid gap-4">
          {location.map((def) => (
            <SensorCard
              key={def.id}
              def={def}
              row={rows[def.id] || { status: 'idle', supported: false }}
              onStart={onStartOne}
              onStop={onStopOne}
              canStop={
                rows[def.id]?.status === 'running' ||
                rows[def.id]?.status === 'starting'
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
