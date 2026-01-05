'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import SensorCard from '@/app/components/SensorCard';
import SensorOverview from '@/app/components/SensorOverview';
import RnboStatusCard from '@/app/components/RnboStatusCard';
import RnboParamList from '@/app/components/RnboParamList';
import LogPanel from '@/app/components/LogPanel';
import RollPitchYawHelp from '@/app/components/mapper/RollPitchYawHelp';
import ParamMappingEditor from '@/app/components/mapper/ParamMappingEditor';

import { createSensorController } from '@/lib/sensors/controller';
import { SENSOR_DEFS } from '@/lib/sensors/defs';
import { createRnboController } from '@/lib/rnbo/controller';
import { listNumberParamDescriptors } from '@/lib/rnbo/params';

import { createMotionControls } from '@/lib/motionMapper/controls';
import { createMappingEngine } from '@/lib/motionMapper/mappingEngine';
import {
  getPatchKey,
  loadMappingFromStorage,
  saveMappingToStorage,
} from '@/lib/motionMapper/storage';

function prependLog(prev, line) {
  const next = `${line}\n${prev || ''}`;
  return next.slice(0, 40_000);
}

function nowMs() {
  return typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();
}

export default function MotionMapperApp() {
  const [mode, setMode] = useState('setup'); // setup | run

  const [patcher, setPatcher] = useState(null);
  const [patchLabel, setPatchLabel] = useState(null);
  const [patchKey, setPatchKey] = useState(null);

  const params = useMemo(() => {
    if (!patcher) return [];
    return listNumberParamDescriptors(patcher);
  }, [patcher]);

  const [mapping, setMapping] = useState({});

  // Run-mode state
  const sensorControllerRef = useRef(null);
  const rnboControllerRef = useRef(null);
  const controlsRef = useRef(null);
  const mapperRef = useRef(null);
  const motionEnabledRef = useRef(true);

  const [rows, setRows] = useState({});
  const [env, setEnv] = useState(null);

  const [rnboState, setRnboState] = useState(null);
  const [rnboLog, setRnboLog] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const [motionEnabled, setMotionEnabled] = useState(true);
  const [motionDebug, setMotionDebug] = useState(null);

  // Load mapping from storage when patcher changes
  useEffect(() => {
    if (!patcher) return;
    const key = getPatchKey(patcher);
    setPatchKey(key);

    const saved = loadMappingFromStorage(key);
    if (saved && typeof saved === 'object') {
      setMapping(saved);
      return;
    }

    // Default: map nothing (user chooses)
    const blank = {};
    for (const p of params) blank[p.paramId] = { source: 'none', invert: false };
    setMapping(blank);
  }, [patcher, params]);

  // Persist mapping changes
  useEffect(() => {
    if (!patchKey) return;
    saveMappingToStorage(patchKey, mapping);
  }, [patchKey, mapping]);

  useEffect(() => {
    motionEnabledRef.current = motionEnabled;
  }, [motionEnabled]);

  async function loadDefaultPatch() {
    const resp = await fetch('/motionSense1/motionSense1.export.json');
    if (!resp.ok) throw new Error(`Failed to fetch default patch (${resp.status})`);
    const json = await resp.json();
    setPatcher(json);
    setPatchLabel('default: /motionSense1/motionSense1.export.json');
  }

  async function loadPatchFromFile(file) {
    const text = await file.text();
    const json = JSON.parse(text);
    setPatcher(json);
    setPatchLabel(`file: ${file.name}`);
  }

  function onChangeMapping(paramId, spec) {
    setMapping((prev) => ({ ...prev, [paramId]: spec }));
  }

  function proceedToRun() {
    if (!patcher) return;
    setMode('run');
  }

  // Initialize controllers only when entering run mode
  useEffect(() => {
    if (mode !== 'run') return;

    const rnboController = createRnboController({
      patcher,
      patcherLabel: patchLabel || 'in-memory patcher',
      onStateUpdate: (next) => setRnboState(next),
      onLog: (line) => setRnboLog((prev) => prependLog(prev, line)),
    });
    rnboControllerRef.current = rnboController;

    const controls = createMotionControls();
    controlsRef.current = controls;

    const mapper = createMappingEngine({
      rnbo: rnboController,
      mapping: {},
      updateHz: 25,
    });
    mapperRef.current = mapper;

    let lastDebugAt = 0;
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
      onReading: (id, reading, tMs) => {
        if (!motionEnabledRef.current) return;
        const ctrl = controlsRef.current;
        const mapr = mapperRef.current;
        if (!ctrl || !mapr) return;

        const update = {};
        if (id === 'orientation_quaternion_relative') update.quaternion = reading?.quaternion;
        if (id === 'linear_acceleration') update.linearAcceleration = reading;
        if (id === 'rotation_rate') update.rotationRate = reading;

        const snapshot = ctrl.update({ tMs, ...update });
        mapr.apply(snapshot.values, tMs);

        if (tMs - lastDebugAt >= 140) {
          lastDebugAt = tMs;
          setMotionDebug({
            enabled: motionEnabledRef.current,
            baseline: snapshot.baseline,
            rotVec: snapshot.rotVec,
            mags: snapshot.mags,
            controls: snapshot.values,
          });
        }
      },
    });
    sensorControllerRef.current = sensorController;

    let cancelled = false;
    setTimeout(() => {
      if (cancelled) return;
      setEnv(sensorController.getEnv());
      setRows(sensorController.getInitialRows());
      setRnboState(rnboController.getState());
      setMotionDebug(controls.getSnapshot());
    }, 0);

    return () => {
      cancelled = true;
      sensorController.destroy();
      rnboController.destroy();
      sensorControllerRef.current = null;
      rnboControllerRef.current = null;
      controlsRef.current = null;
      mapperRef.current = null;
    };
  }, [mode, patcher, patchLabel]);

  useEffect(() => {
    if (mode !== 'run') return;
    mapperRef.current?.setMapping(mapping);
  }, [mode, mapping]);

  const motionDefs = SENSOR_DEFS.filter((d) => d.category === 'Motion');
  const orientationDefs = SENSOR_DEFS.filter((d) => d.category === 'Orientation');
  const locationDefs = SENSOR_DEFS.filter((d) => d.category === 'Location');

  const onStartAudio = async () => {
    const rnbo = rnboControllerRef.current;
    if (!rnbo) return;
    setIsStarting(true);
    try {
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

  const onRecalibrate = () => {
    controlsRef.current?.recalibrate();
    setMotionDebug((prev) => ({ ...(prev || {}), note: 'recalibrated', tMs: nowMs() }));
  };

  if (mode === 'setup') {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              RNBO Motion Mapper
            </h1>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Load an RNBO export, then map parameters to motion controls.
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <RollPitchYawHelp />

          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Load RNBO patch
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  Loaded: <span className="font-mono">{patchLabel || '—'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadDefaultPatch().catch((e) => alert(e.message))}
                  className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Load default
                </button>
                <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900">
                  Choose export.json…
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      if (!file) return;
                      loadPatchFromFile(file).catch((err) => alert(err.message));
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Parameter mappings
              </h2>
              <button
                type="button"
                disabled={!patcher}
                onClick={proceedToRun}
                className="inline-flex h-10 items-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                OK → Run
              </button>
            </div>

            <ParamMappingEditor
              params={params}
              mapping={mapping}
              onChange={onChangeMapping}
            />
          </div>
        </div>
      </div>
    );
  }

  // run mode
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            RNBO Motion Mapper (Run)
          </h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Patch: <span className="font-mono">{patchLabel || '—'}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('setup')}
            className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Back to mapping
          </button>
          <button
            type="button"
            onClick={() => setMotionEnabled((v) => !v)}
            className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {motionEnabled ? 'Motion: ON' : 'Motion: OFF'}
          </button>
          <button
            type="button"
            onClick={onRecalibrate}
            className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Recalibrate
          </button>
          <button
            type="button"
            onClick={() => sensorControllerRef.current?.startAll()}
            className="inline-flex h-10 items-center rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start sensors
          </button>
          <button
            type="button"
            onClick={() => sensorControllerRef.current?.stopAll()}
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
          Motion mapping debug
        </h2>
        <LogPanel
          title="Controls / rotation vector"
          text={motionDebug ? JSON.stringify(motionDebug, null, 2) : '—'}
        />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          RNBO parameters
        </h2>
        <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sliders still work manually; mapped parameters will also be updated from motion while motion is ON.
        </div>
        <RnboParamList params={rnboState?.params} onChange={onParamChange} />
      </section>

      <SensorOverview defs={SENSOR_DEFS} rows={rows} />

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Motion
        </h2>
        <div className="mt-3 grid gap-4">
          {motionDefs.map((def) => (
            <SensorCard
              key={def.id}
              def={def}
              row={rows[def.id] || { status: 'idle', supported: false }}
              onStart={(id) => sensorControllerRef.current?.start(id)}
              onStop={(id) => sensorControllerRef.current?.stop(id)}
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
          {orientationDefs.map((def) => (
            <SensorCard
              key={def.id}
              def={def}
              row={rows[def.id] || { status: 'idle', supported: false }}
              onStart={(id) => sensorControllerRef.current?.start(id)}
              onStop={(id) => sensorControllerRef.current?.stop(id)}
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
          {locationDefs.map((def) => (
            <SensorCard
              key={def.id}
              def={def}
              row={rows[def.id] || { status: 'idle', supported: false }}
              onStart={(id) => sensorControllerRef.current?.start(id)}
              onStop={(id) => sensorControllerRef.current?.stop(id)}
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
