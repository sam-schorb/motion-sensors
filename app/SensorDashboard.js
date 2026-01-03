"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function nowIso() {
  return new Date().toISOString();
}

function safeError(err) {
  if (!err) return { name: "Error", message: "Unknown error" };
  if (typeof err === "string") return { name: "Error", message: err };
  return {
    name: err.name || err.error?.name || "Error",
    message: err.message || err.error?.message || "Unknown error",
  };
}

function isCtorAvailable(name) {
  return typeof window !== "undefined" && typeof window[name] === "function";
}

async function requestMotionPermissionIfNeeded() {
  if (typeof DeviceMotionEvent === "undefined") return { ok: false };
  if (typeof DeviceMotionEvent.requestPermission !== "function") return { ok: true };
  const result = await DeviceMotionEvent.requestPermission();
  return { ok: result === "granted" };
}

async function requestOrientationPermissionIfNeeded() {
  if (typeof DeviceOrientationEvent === "undefined") return { ok: false };
  if (typeof DeviceOrientationEvent.requestPermission !== "function") return { ok: true };
  const result = await DeviceOrientationEvent.requestPermission();
  return { ok: result === "granted" };
}

function startGenericSensor({ ctorName, options, read, onData, onError }) {
  if (!isCtorAvailable(ctorName)) {
    throw new Error(`${ctorName} is not available in this browser`);
  }

  const Ctor = window[ctorName];
  const sensor = new Ctor(options);

  const onReading = () => {
    try {
      onData(read(sensor));
    } catch (err) {
      onError(err);
    }
  };

  const onSensorError = (e) => onError(e?.error || e);

  sensor.addEventListener("reading", onReading);
  sensor.addEventListener("error", onSensorError);
  sensor.start();

  return () => {
    sensor.removeEventListener("reading", onReading);
    sensor.removeEventListener("error", onSensorError);
    try {
      sensor.stop();
    } catch {
      // ignore
    }
  };
}

function startDeviceMotion({ onData }) {
  if (typeof window === "undefined" || typeof DeviceMotionEvent === "undefined") {
    throw new Error("DeviceMotionEvent is not available in this browser");
  }

  const handler = (e) => {
    const a = e.acceleration || null;
    const ag = e.accelerationIncludingGravity || null;
    const rr = e.rotationRate || null;

    const degreesToRad = (deg) => (typeof deg === "number" ? (deg * Math.PI) / 180 : null);

    onData({
      intervalMs: typeof e.interval === "number" ? e.interval : null,
      acceleration: a
        ? { x: a.x ?? null, y: a.y ?? null, z: a.z ?? null, units: "m/s²" }
        : null,
      accelerationIncludingGravity: ag
        ? { x: ag.x ?? null, y: ag.y ?? null, z: ag.z ?? null, units: "m/s²" }
        : null,
      rotationRate: rr
        ? {
            alphaDegPerSec: rr.alpha ?? null,
            betaDegPerSec: rr.beta ?? null,
            gammaDegPerSec: rr.gamma ?? null,
            alphaRadPerSec: degreesToRad(rr.alpha ?? null),
            betaRadPerSec: degreesToRad(rr.beta ?? null),
            gammaRadPerSec: degreesToRad(rr.gamma ?? null),
          }
        : null,
    });
  };

  window.addEventListener("devicemotion", handler);

  return () => {
    window.removeEventListener("devicemotion", handler);
  };
}

function startDeviceOrientation({ onData }) {
  if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") {
    throw new Error("DeviceOrientationEvent is not available in this browser");
  }

  const handler = (e) => {
    onData({
      alpha: e.alpha ?? null,
      beta: e.beta ?? null,
      gamma: e.gamma ?? null,
      absolute: e.absolute ?? null,
      units: "degrees",
    });
  };

  window.addEventListener("deviceorientation", handler);

  return () => {
    window.removeEventListener("deviceorientation", handler);
  };
}

function startGeolocation({ onData, onError }) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not available in this browser");
  }

  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const { coords, timestamp } = pos;
      onData({
        latitude: coords.latitude,
        longitude: coords.longitude,
        altitude: coords.altitude,
        accuracy: coords.accuracy,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
        timestamp,
      });
    },
    (err) => onError(err),
    { enableHighAccuracy: true, maximumAge: 0 }
  );

  return () => navigator.geolocation.clearWatch(id);
}

function Chip({ children, tone = "neutral" }) {
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

function formatValue(value) {
  return JSON.stringify(value, null, 2);
}

export default function SensorDashboard() {
  const stopFnsRef = useRef(new Map());
  const lastUiUpdateRef = useRef(new Map());

  const [rows, setRows] = useState(() => ({}));
  const [env, setEnv] = useState(null);

  const defs = useMemo(
    () => [
      {
        key: "TYPE_ACCELEROMETER",
        category: "Motion",
        label: "Accelerometer",
        webStrategies: [
          { id: "Accelerometer", label: "Generic Sensor: Accelerometer" },
          { id: "DeviceMotion.accelerationIncludingGravity", label: "DeviceMotion: accelerationIncludingGravity" },
        ],
      },
      {
        key: "TYPE_GRAVITY",
        category: "Motion",
        label: "Gravity",
        webStrategies: [
          { id: "GravitySensor", label: "Generic Sensor: GravitySensor" },
          { id: "DeviceMotion.derivedGravity", label: "DeviceMotion: derived (incl. gravity - linear accel)" },
        ],
      },
      {
        key: "TYPE_LINEAR_ACCELERATION",
        category: "Motion",
        label: "Linear acceleration",
        webStrategies: [
          { id: "LinearAccelerationSensor", label: "Generic Sensor: LinearAccelerationSensor" },
          { id: "DeviceMotion.acceleration", label: "DeviceMotion: acceleration" },
        ],
      },
      {
        key: "TYPE_GYROSCOPE",
        category: "Motion",
        label: "Gyroscope",
        webStrategies: [
          { id: "Gyroscope", label: "Generic Sensor: Gyroscope" },
          { id: "DeviceMotion.rotationRate", label: "DeviceMotion: rotationRate" },
        ],
      },
      {
        key: "TYPE_ROTATION_VECTOR",
        category: "Motion",
        label: "Rotation vector",
        webStrategies: [
          { id: "AbsoluteOrientationSensor", label: "Generic Sensor: AbsoluteOrientationSensor" },
          { id: "DeviceOrientation", label: "DeviceOrientationEvent" },
        ],
      },
      {
        key: "TYPE_ORIENTATION",
        category: "Position",
        label: "Orientation (deprecated on Android)",
        webStrategies: [{ id: "DeviceOrientation", label: "DeviceOrientationEvent" }],
      },
      {
        key: "TYPE_GAME_ROTATION_VECTOR",
        category: "Position",
        label: "Game rotation vector",
        webStrategies: [
          { id: "RelativeOrientationSensor", label: "Generic Sensor: RelativeOrientationSensor" },
          { id: "DeviceOrientation", label: "DeviceOrientationEvent" },
        ],
      },
      {
        key: "TYPE_GEOMAGNETIC_ROTATION_VECTOR",
        category: "Position",
        label: "Geomagnetic rotation vector",
        webStrategies: [
          { id: "AbsoluteOrientationSensor", label: "Generic Sensor: AbsoluteOrientationSensor" },
          { id: "DeviceOrientation", label: "DeviceOrientationEvent" },
        ],
      },

      {
        key: "GEOLOCATION",
        category: "Position",
        label: "Geolocation (GPS/network)",
        webStrategies: [{ id: "Geolocation", label: "Web API: navigator.geolocation" }],
      },
    ],
    []
  );

  const updateRow = useCallback((key, patch) => {
    setRows((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...patch,
      },
    }));
  }, []);

  const updateReadingThrottled = useCallback(
    (key, reading) => {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const last = lastUiUpdateRef.current.get(key) ?? 0;
      if (now - last < 100) return;
      lastUiUpdateRef.current.set(key, now);
      updateRow(key, { reading, lastUpdatedAt: nowIso() });
    },
    [updateRow]
  );

  const detectSupport = useCallback((strategyId) => {
    if (typeof window === "undefined") return false;
    switch (strategyId) {
      case "Accelerometer":
      case "Gyroscope":
      case "Magnetometer":
      case "GravitySensor":
      case "LinearAccelerationSensor":
      case "AbsoluteOrientationSensor":
      case "RelativeOrientationSensor":
        return isCtorAvailable(strategyId);
      case "DeviceMotion.accelerationIncludingGravity":
      case "DeviceMotion.acceleration":
      case "DeviceMotion.rotationRate":
      case "DeviceMotion.derivedGravity":
        return typeof DeviceMotionEvent !== "undefined";
      case "DeviceOrientation":
        return typeof DeviceOrientationEvent !== "undefined";
      case "Geolocation":
        return typeof navigator !== "undefined" && !!navigator.geolocation;
      default:
        return false;
    }
  }, []);

  const stop = useCallback(
    (key) => {
      const stopFn = stopFnsRef.current.get(key);
      if (stopFn) {
        stopFnsRef.current.delete(key);
        try {
          stopFn();
        } catch {
          // ignore
        }
      }
      updateRow(key, { status: "stopped" });
    },
    [updateRow]
  );

  const stopAllNoState = useCallback(() => {
    for (const stopFn of stopFnsRef.current.values()) {
      try {
        stopFn();
      } catch {
        // ignore
      }
    }
    stopFnsRef.current.clear();
  }, []);

  const stopAll = useCallback(() => {
    for (const key of Array.from(stopFnsRef.current.keys())) stop(key);
  }, [stop]);

  const start = useCallback(
    async (key) => {
      stop(key);

      const def = defs.find((d) => d.key === key);
      if (!def) return;

      const supported = def.webStrategies.find((s) => detectSupport(s.id));
      if (!supported || supported.id === "unavailable") {
        updateRow(key, {
          status: "unavailable",
          error: { name: "Unsupported", message: "No supported Web API for this sensor on this browser." },
        });
        return;
      }

      updateRow(key, { status: "starting", error: null, strategy: supported.label });

      try {
        let stopFn = null;

        if (supported.id.startsWith("DeviceMotion")) {
          const perm = await requestMotionPermissionIfNeeded();
          if (!perm.ok) throw new Error("Motion permission was not granted.");

          stopFn = startDeviceMotion({
            onData: (data) => {
              if (supported.id === "DeviceMotion.accelerationIncludingGravity") {
                updateReadingThrottled(key, data.accelerationIncludingGravity);
              } else if (supported.id === "DeviceMotion.acceleration") {
                updateReadingThrottled(key, data.acceleration);
              } else if (supported.id === "DeviceMotion.rotationRate") {
                updateReadingThrottled(key, data.rotationRate);
              } else if (supported.id === "DeviceMotion.derivedGravity") {
                const ag = data.accelerationIncludingGravity;
                const a = data.acceleration;
                if (!ag || !a) return;
                updateReadingThrottled(key, {
                  x: ag.x != null && a.x != null ? ag.x - a.x : null,
                  y: ag.y != null && a.y != null ? ag.y - a.y : null,
                  z: ag.z != null && a.z != null ? ag.z - a.z : null,
                  units: "m/s²",
                  note: "derived from DeviceMotion (includingGravity - acceleration)",
                });
              }
            },
          });
        } else if (supported.id === "DeviceOrientation") {
          const perm = await requestOrientationPermissionIfNeeded();
          if (!perm.ok) throw new Error("Orientation permission was not granted.");

          stopFn = startDeviceOrientation({
            onData: (data) => updateReadingThrottled(key, data),
          });
        } else if (supported.id === "Geolocation") {
          stopFn = startGeolocation({
            onData: (data) => updateReadingThrottled(key, data),
            onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
          });
        } else if (supported.id === "Accelerometer") {
          stopFn = startGenericSensor({
            ctorName: "Accelerometer",
            options: { frequency: 60 },
            read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "m/s²" }),
            onData: (data) => updateReadingThrottled(key, data),
            onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
          });
        } else if (supported.id === "LinearAccelerationSensor") {
          stopFn = startGenericSensor({
            ctorName: "LinearAccelerationSensor",
            options: { frequency: 60 },
            read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "m/s²" }),
            onData: (data) => updateReadingThrottled(key, data),
            onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
          });
        } else if (supported.id === "GravitySensor") {
          stopFn = startGenericSensor({
            ctorName: "GravitySensor",
            options: { frequency: 60 },
            read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "m/s²" }),
            onData: (data) => updateReadingThrottled(key, data),
            onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
          });
        } else if (supported.id === "Gyroscope") {
          stopFn = startGenericSensor({
            ctorName: "Gyroscope",
            options: { frequency: 60 },
            read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "rad/s" }),
            onData: (data) => updateReadingThrottled(key, data),
            onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
          });
        } else if (supported.id === "Magnetometer") {
          stopFn = startGenericSensor({
            ctorName: "Magnetometer",
            options: { frequency: 20 },
            read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "μT (approx.)" }),
            onData: (data) => updateReadingThrottled(key, data),
            onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
          });
        } else if (supported.id === "AbsoluteOrientationSensor") {
          stopFn = startGenericSensor({
            ctorName: "AbsoluteOrientationSensor",
            options: { frequency: 60 },
            read: (s) => ({ quaternion: Array.from(s.quaternion || []), units: "unit quaternion" }),
            onData: (data) => updateReadingThrottled(key, data),
            onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
          });
        } else if (supported.id === "RelativeOrientationSensor") {
          stopFn = startGenericSensor({
            ctorName: "RelativeOrientationSensor",
            options: { frequency: 60 },
            read: (s) => ({ quaternion: Array.from(s.quaternion || []), units: "unit quaternion" }),
            onData: (data) => updateReadingThrottled(key, data),
            onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
          });
        } else {
          throw new Error(`Unsupported strategy: ${supported.id}`);
        }

        stopFnsRef.current.set(key, stopFn);
        updateRow(key, { status: "running", error: null });
      } catch (err) {
        updateRow(key, { status: "error", error: safeError(err) });
      }
    },
    [defs, detectSupport, stop, updateReadingThrottled, updateRow]
  );

  const startAll = useCallback(async () => {
    for (const def of defs) {
      await start(def.key);
    }
  }, [defs, start]);

  useEffect(() => {
    setEnv({
      isSecureContext: typeof window !== "undefined" ? window.isSecureContext : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    const initial = {};
    for (const def of defs) {
      const supported = def.webStrategies.some((s) => detectSupport(s.id));
      initial[def.key] = {
        status: "idle",
        supported,
        strategy: null,
        lastUpdatedAt: null,
        reading: null,
        error: null,
      };
    }
    setRows(initial);

    return () => stopAllNoState();
  }, [defs, detectSupport, stopAllNoState]);

  const motion = defs.filter((d) => d.category === "Motion");
  const position = defs.filter((d) => d.category === "Position");

  const renderRow = (def) => {
    const row = rows[def.key] || { status: "idle" };
    const isRunning = row.status === "running" || row.status === "starting";
    const supported = row.supported;

    const tone =
      row.status === "running"
        ? "good"
        : row.status === "error"
          ? "bad"
          : row.status === "unavailable"
            ? "warn"
            : supported
              ? "neutral"
              : "warn";

    const statusLabel =
      row.status === "running"
        ? "running"
        : row.status === "starting"
          ? "starting"
          : row.status === "stopped"
            ? "stopped"
            : row.status === "error"
              ? "error"
              : row.status === "unavailable"
                ? "unavailable"
                : supported
                  ? "ready"
                  : "unsupported";

    return (
      <div
        key={def.key}
        className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{def.label}</div>
              <Chip tone={tone}>{statusLabel}</Chip>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{def.key}</span>
            </div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {row.strategy ? `Using: ${row.strategy}` : `Strategies: ${def.webStrategies.map((s) => s.label).join(" • ")}`}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => start(def.key)}
              disabled={!supported || isRunning}
              className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Start
            </button>
            <button
              type="button"
              onClick={() => stop(def.key)}
              disabled={!stopFnsRef.current.has(def.key)}
              className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-100"
            >
              Stop
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800">
            <div className="flex items-center justify-between">
              <div className="font-medium">Latest reading</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{row.lastUpdatedAt || "—"}</div>
            </div>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
              {row.reading ? formatValue(row.reading) : "—"}
            </pre>
          </div>

          <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800">
            <div className="font-medium">Errors</div>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed">
              {row.error ? formatValue(row.error) : "—"}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Motion + Position Sensors (Web)
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            This page starts the motion/orientation/location APIs that are currently supported by your browser and
            displays live readings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={startAll}
            className="inline-flex h-10 items-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Start all
          </button>
          <button
            type="button"
            onClick={stopAll}
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

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Motion</h2>
        <div className="mt-3 grid gap-4">{motion.map(renderRow)}</div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Position</h2>
        <div className="mt-3 grid gap-4">{position.map(renderRow)}</div>
      </section>
    </div>
  );
}
