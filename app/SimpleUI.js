'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Space_Mono } from 'next/font/google';
import { createSensorController } from '@/lib/sensors/controller';
import { SENSOR_DEFS } from '@/lib/sensors/defs';
import { createRnboController } from '@/lib/rnbo/controller';
import { createMotionControls } from '@/lib/motionMapper/controls';
import { createMappingEngine } from '@/lib/motionMapper/mappingEngine';

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
});

const PATCH_OPTIONS = [
  {
    id: 'motionSense1',
    label: 'Arps',
    path: '/motionSense1/motionSense1.export.json',
  },
  {
    id: 'motionSense2',
    label: 'Chimes',
    path: '/motionSense2/motionSense2.export.json',
  },
];

const PATCH_MAPPINGS = {
  motionSense1: {
    seqlength: { source: 'pitch', invert: false },
    metroRate: { source: 'yaw', invert: false },
    degrade: { source: 'lin', invert: false },
    delay: { source: 'rot', invert: false },
    offset: { source: 'roll', invert: false },
    envLength: { source: 'yaw', invert: false },
    freq: { source: 'pitch', invert: false },
  },
  motionSense2: {
    masterControl: { source: 'lin', invert: false },
  },
};

const ACTION_LABELS = {
  motionSense1: 'Move',
  motionSense2: 'Shake',
};

function getRequiredSensorDefs(mapping) {
  const sources = new Set(
    Object.values(mapping || {})
      .map((spec) => spec?.source)
      .filter(Boolean),
  );
  const requiredIds = new Set();

  if (sources.has('roll') || sources.has('pitch') || sources.has('yaw')) {
    requiredIds.add('orientation_quaternion_relative');
  }
  if (sources.has('lin')) requiredIds.add('linear_acceleration');
  if (sources.has('rot')) requiredIds.add('rotation_rate');

  return SENSOR_DEFS.filter((def) => requiredIds.has(def.id));
}

async function fetchPatchJson(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch patch (${resp.status})`);
  return resp.json();
}

async function teardownRuntime({
  sensorControllerRef,
  rnboControllerRef,
  controlsRef,
  mapperRef,
}) {
  const sensorController = sensorControllerRef.current;
  sensorControllerRef.current = null;
  try {
    sensorController?.destroy();
  } catch {
    // ignore teardown errors
  }

  const rnboController = rnboControllerRef.current;
  rnboControllerRef.current = null;
  try {
    await rnboController?.stopAudio();
  } catch {
    // ignore teardown errors
  }
  try {
    rnboController?.destroy();
  } catch {
    // ignore teardown errors
  }

  controlsRef.current = null;
  mapperRef.current = null;
}

export default function SimpleUI() {
  const [selectedPatchId, setSelectedPatchId] = useState(PATCH_OPTIONS[0].id);
  const [buttonState, setButtonState] = useState('idle'); // idle | starting | running | error

  const sensorControllerRef = useRef(null);
  const rnboControllerRef = useRef(null);
  const controlsRef = useRef(null);
  const mapperRef = useRef(null);
  const patchCacheRef = useRef(new Map());
  const opIdRef = useRef(0);

  const selectedPatch = useMemo(
    () => PATCH_OPTIONS.find((opt) => opt.id === selectedPatchId) || null,
    [selectedPatchId],
  );

  const actionLabel = ACTION_LABELS[selectedPatchId] || 'Move';

  const buttonToneClass = useMemo(() => {
    if (buttonState === 'running') {
      return 'bg-lime-400 text-pink-700 shadow-[0_11px_0_#14532d]';
    }
    if (buttonState === 'error') {
      return 'bg-orange-400 text-pink-700 shadow-[0_11px_0_#9a3412]';
    }
    if (buttonState === 'starting') {
      return 'bg-white text-pink-700 shadow-[0_11px_0_#111] opacity-90';
    }
    return 'bg-white text-pink-700 shadow-[0_11px_0_#111]';
  }, [buttonState]);

  const startRuntime = async () => {
    if (!selectedPatch) return;
    const opId = ++opIdRef.current;
    setButtonState('starting');

    await teardownRuntime({
      sensorControllerRef,
      rnboControllerRef,
      controlsRef,
      mapperRef,
    });

    try {
      let patcher = patchCacheRef.current.get(selectedPatch.path);
      if (!patcher) {
        patcher = await fetchPatchJson(selectedPatch.path);
        patchCacheRef.current.set(selectedPatch.path, patcher);
      }
      if (opId !== opIdRef.current) return;

      const mapping = PATCH_MAPPINGS[selectedPatch.id] || {};
      const rnboController = createRnboController({
        patcher,
        patcherLabel: `bundle: ${selectedPatch.path}`,
      });
      const controls = createMotionControls();
      const mapper = createMappingEngine({
        rnbo: rnboController,
        mapping,
        updateHz: 25,
      });
      const sensorController = createSensorController({
        defs: getRequiredSensorDefs(mapping),
        onRowUpdate: () => {},
        onReading: (id, reading, tMs) => {
          const update = {};
          if (id === 'orientation_quaternion_relative') update.quaternion = reading?.quaternion;
          if (id === 'linear_acceleration') update.linearAcceleration = reading;
          if (id === 'rotation_rate') update.rotationRate = reading;
          const snapshot = controls.update({ tMs, ...update });
          mapper.apply(snapshot.values, tMs);
        },
      });

      rnboControllerRef.current = rnboController;
      controlsRef.current = controls;
      mapperRef.current = mapper;
      sensorControllerRef.current = sensorController;

      await rnboController.start();
      await sensorController.startAll();

      if (opId !== opIdRef.current) {
        await teardownRuntime({
          sensorControllerRef,
          rnboControllerRef,
          controlsRef,
          mapperRef,
        });
        return;
      }
      setButtonState('running');
    } catch (err) {
      console.error('Simple UI start failed', err);
      if (opId === opIdRef.current) setButtonState('error');
      await teardownRuntime({
        sensorControllerRef,
        rnboControllerRef,
        controlsRef,
        mapperRef,
      });
    }
  };

  const onMainButtonClick = async () => {
    if (buttonState === 'running' || buttonState === 'starting') {
      opIdRef.current += 1;
      setButtonState('idle');
      await teardownRuntime({
        sensorControllerRef,
        rnboControllerRef,
        controlsRef,
        mapperRef,
      });
      return;
    }
    await startRuntime();
  };

  useEffect(() => {
    opIdRef.current += 1;
    void teardownRuntime({
      sensorControllerRef,
      rnboControllerRef,
      controlsRef,
      mapperRef,
    });
  }, [selectedPatchId]);

  useEffect(() => {
    return () => {
      opIdRef.current += 1;
      void teardownRuntime({
        sensorControllerRef,
        rnboControllerRef,
        controlsRef,
        mapperRef,
      });
    };
  }, []);

  const buttonLabel = buttonState === 'running' ? actionLabel : 'Start';

  return (
    <main className={`${spaceMono.className} relative flex min-h-dvh items-center justify-center overflow-hidden bg-pink-300 px-4 py-8`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(255,255,255,0.55),transparent_45%),radial-gradient(circle_at_82%_78%,rgba(255,255,255,0.38),transparent_46%)]" />

      <section className="relative w-full max-w-md rounded-[2rem] border-4 border-black bg-pink-200/90 p-6 shadow-[0_12px_0_#111] sm:p-8">
        <label
          htmlFor="simple-patch"
          className="mt-2 block text-center text-base font-semibold uppercase tracking-[0.2em] text-pink-700 sm:text-lg"
        >
          Sound
        </label>
        <div className="relative mt-2">
          <select
            id="simple-patch"
            value={selectedPatchId}
            onChange={(e) => {
              setButtonState('idle');
              setSelectedPatchId(e.target.value);
            }}
            className="h-16 w-full cursor-pointer appearance-none rounded-2xl border-4 border-black bg-white px-12 pr-16 text-center text-2xl font-bold text-pink-700 shadow-[0_6px_0_#111] outline-none focus:border-black focus:outline-none sm:text-3xl"
          >
            {PATCH_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border-2 border-black bg-pink-100 p-1 text-pink-700">
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
              <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onMainButtonClick().catch((err) => console.error(err));
          }}
          className={`mt-6 h-44 w-full select-none rounded-3xl border-4 border-black text-6xl font-black uppercase tracking-wide transition-all duration-150 active:translate-y-[6px] active:shadow-[0_5px_0_#111] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/80 sm:h-52 sm:text-7xl ${buttonToneClass}`}
        >
          {buttonLabel}
        </button>

        <div className="sr-only" aria-live="polite">
          {buttonState === 'running' ? `${actionLabel} active` : buttonState}
        </div>
      </section>
    </main>
  );
}
