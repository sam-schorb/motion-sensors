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

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function quatMultiply(a, b) {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

function quatConjugate(q) {
  return [-q[0], -q[1], -q[2], q[3]];
}

function quatNormSquared(q) {
  return q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
}

function quatInverse(q) {
  const n2 = quatNormSquared(q);
  if (!n2) return null;
  const c = quatConjugate(q);
  return [c[0] / n2, c[1] / n2, c[2] / n2, c[3] / n2];
}

function quaternionFromDeviceOrientationDegrees({ alpha, beta, gamma }) {
  if (![alpha, beta, gamma].every((v) => typeof v === "number")) return null;

  const a = degToRad(alpha);
  const b = degToRad(beta);
  const g = degToRad(gamma);

  const halfA = a / 2;
  const halfB = b / 2;
  const halfG = g / 2;

  // DeviceOrientationEvent angles are defined as rotations about:
  // alpha: z-axis, beta: x-axis, gamma: y-axis (degrees).
  // This produces an approximate quaternion with order q = qz * qx * qy.
  const qz = [0, 0, Math.sin(halfA), Math.cos(halfA)];
  const qx = [Math.sin(halfB), 0, 0, Math.cos(halfB)];
  const qy = [0, Math.sin(halfG), 0, Math.cos(halfG)];

  return quatMultiply(quatMultiply(qz, qx), qy);
}

function startDeviceOrientationQuaternion({ mode, onData, onError }) {
  if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") {
    throw new Error("DeviceOrientationEvent is not available in this browser");
  }

  let baseline = null;

  const handler = (e) => {
    try {
      const alpha = e.alpha ?? null;
      const beta = e.beta ?? null;
      const gamma = e.gamma ?? null;
      const q = quaternionFromDeviceOrientationDegrees({
        alpha: typeof alpha === "number" ? alpha : null,
        beta: typeof beta === "number" ? beta : null,
        gamma: typeof gamma === "number" ? gamma : null,
      });

      if (!q) return;

      if (mode === "relative") {
        if (!baseline) baseline = q;
        const inv = quatInverse(baseline);
        if (!inv) return;
        onData({
          quaternion: quatMultiply(inv, q),
          units: "unit quaternion",
          note: "derived from DeviceOrientationEvent (relative to start)",
        });
        return;
      }

      onData({
        quaternion: q,
        units: "unit quaternion",
        note: "derived from DeviceOrientationEvent (approx)",
      });
    } catch (err) {
      onError(err);
    }
  };

  window.addEventListener("deviceorientation", handler);

  return () => {
    window.removeEventListener("deviceorientation", handler);
  };
}

export default function SensorDashboard() {
  const stopFnsRef = useRef(new Map());
  const lastUiUpdateRef = useRef(new Map());
  const permissionRef = useRef({ motion: null, orientation: null });

  const [rows, setRows] = useState(() => ({}));
  const [env, setEnv] = useState(null);

  const defs = useMemo(
    () => [
      {
        id: "acceleration_including_gravity",
        category: "Motion",
        label: "Acceleration (including gravity)",
        android: "TYPE_ACCELEROMETER",
        ios: "CMAccelerometerData / CMDeviceMotion",
        webStrategies: [
          { id: "Accelerometer", label: "Generic Sensor: Accelerometer" },
          { id: "DeviceMotion.accelerationIncludingGravity", label: "DeviceMotion: accelerationIncludingGravity" },
        ],
      },
      {
        id: "gravity",
        category: "Motion",
        label: "Gravity",
        android: "TYPE_GRAVITY",
        ios: "CMDeviceMotion.gravity",
        webStrategies: [
          { id: "GravitySensor", label: "Generic Sensor: GravitySensor" },
          { id: "DeviceMotion.derivedGravity", label: "DeviceMotion: derived (incl. gravity - linear accel)" },
        ],
      },
      {
        id: "linear_acceleration",
        category: "Motion",
        label: "Linear acceleration",
        android: "TYPE_LINEAR_ACCELERATION",
        ios: "CMDeviceMotion.userAcceleration",
        webStrategies: [
          { id: "LinearAccelerationSensor", label: "Generic Sensor: LinearAccelerationSensor" },
          { id: "DeviceMotion.acceleration", label: "DeviceMotion: acceleration" },
        ],
      },
      {
        id: "rotation_rate",
        category: "Motion",
        label: "Rotation rate (gyroscope)",
        android: "TYPE_GYROSCOPE",
        ios: "CMGyroData / CMDeviceMotion.rotationRate",
        webStrategies: [
          { id: "Gyroscope", label: "Generic Sensor: Gyroscope" },
          { id: "DeviceMotion.rotationRate", label: "DeviceMotion: rotationRate" },
        ],
      },
      {
        id: "rotation_vector_quaternion",
        category: "Orientation",
        label: "Rotation vector (quaternion)",
        android: "TYPE_ROTATION_VECTOR",
        ios: "CMDeviceMotion.attitude (quaternion)",
        webStrategies: [
          { id: "AbsoluteOrientationSensor", label: "Generic Sensor: AbsoluteOrientationSensor" },
          { id: "DeviceOrientationQuaternion.absolute", label: "Derived: DeviceOrientationEvent → quaternion" },
        ],
      },
      {
        id: "geomagnetic_rotation_vector_quaternion",
        category: "Orientation",
        label: "Geomagnetic rotation vector (quaternion)",
        android: "TYPE_GEOMAGNETIC_ROTATION_VECTOR",
        ios: "CMDeviceMotion.attitude (quaternion)",
        webStrategies: [
          { id: "AbsoluteOrientationSensor", label: "Generic Sensor: AbsoluteOrientationSensor" },
          { id: "DeviceOrientationQuaternion.absolute", label: "Derived: DeviceOrientationEvent → quaternion" },
        ],
      },
      {
        id: "orientation_euler",
        category: "Orientation",
        label: "Orientation (alpha/beta/gamma)",
        android: "TYPE_ORIENTATION (deprecated)",
        ios: "CMAttitude (roll/pitch/yaw)",
        webStrategies: [{ id: "DeviceOrientation", label: "DeviceOrientationEvent" }],
      },
      {
        id: "orientation_quaternion_relative",
        category: "Orientation",
        label: "Orientation (quaternion, relative)",
        android: "TYPE_GAME_ROTATION_VECTOR",
        ios: "CMAttitude (relative changes)",
        webStrategies: [
          { id: "RelativeOrientationSensor", label: "Generic Sensor: RelativeOrientationSensor" },
          { id: "DeviceOrientationQuaternion.relative", label: "Derived: DeviceOrientationEvent → quaternion (relative)" },
        ],
      },

      {
        id: "geolocation",
        category: "Location",
        label: "Geolocation (GPS/network)",
        android: "Location (GPS/network)",
        ios: "Core Location (CLLocationManager)",
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
      case "DeviceOrientationQuaternion.absolute":
      case "DeviceOrientationQuaternion.relative":
        return typeof DeviceOrientationEvent !== "undefined";
      case "Geolocation":
        return typeof navigator !== "undefined" && !!navigator.geolocation;
      default:
        return false;
    }
  }, []);

  const ensureMotionPermission = useCallback(async () => {
    if (!permissionRef.current.motion) {
      permissionRef.current.motion = requestMotionPermissionIfNeeded();
    }
    return permissionRef.current.motion;
  }, []);

  const ensureOrientationPermission = useCallback(async () => {
    if (!permissionRef.current.orientation) {
      permissionRef.current.orientation = requestOrientationPermissionIfNeeded();
    }
    return permissionRef.current.orientation;
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

      const def = defs.find((d) => d.id === key);
      if (!def) return;

      const supportedStrategies = def.webStrategies.filter((s) => detectSupport(s.id));
      if (!supportedStrategies.length) {
        updateRow(key, {
          status: "unavailable",
          error: { name: "Unsupported", message: "No supported Web API for this sensor on this browser." },
        });
        return;
      }

      updateRow(key, { status: "starting", error: null, strategy: null });

      let lastErr = null;

      for (const strategy of supportedStrategies) {
        updateRow(key, { status: "starting", error: null, strategy: strategy.label });
        try {
          let stopFn = null;

          if (strategy.id.startsWith("DeviceMotion")) {
            const perm = await ensureMotionPermission();
            if (!perm.ok) throw new Error("Motion permission was not granted.");

            stopFn = startDeviceMotion({
              onData: (data) => {
                if (strategy.id === "DeviceMotion.accelerationIncludingGravity") {
                  updateReadingThrottled(key, data.accelerationIncludingGravity);
                } else if (strategy.id === "DeviceMotion.acceleration") {
                  updateReadingThrottled(key, data.acceleration);
                } else if (strategy.id === "DeviceMotion.rotationRate") {
                  updateReadingThrottled(key, data.rotationRate);
                } else if (strategy.id === "DeviceMotion.derivedGravity") {
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
          } else if (strategy.id === "DeviceOrientation") {
            const perm = await ensureOrientationPermission();
            if (!perm.ok) throw new Error("Orientation permission was not granted.");

            stopFn = startDeviceOrientation({
              onData: (data) => updateReadingThrottled(key, data),
            });
          } else if (strategy.id === "DeviceOrientationQuaternion.absolute") {
            const perm = await ensureOrientationPermission();
            if (!perm.ok) throw new Error("Orientation permission was not granted.");

            stopFn = startDeviceOrientationQuaternion({
              mode: "absolute",
              onData: (data) => updateReadingThrottled(key, data),
              onError: (err) => updateRow(key, { error: safeError(err) }),
            });
          } else if (strategy.id === "DeviceOrientationQuaternion.relative") {
            const perm = await ensureOrientationPermission();
            if (!perm.ok) throw new Error("Orientation permission was not granted.");

            stopFn = startDeviceOrientationQuaternion({
              mode: "relative",
              onData: (data) => updateReadingThrottled(key, data),
              onError: (err) => updateRow(key, { error: safeError(err) }),
            });
          } else if (strategy.id === "Geolocation") {
            stopFn = startGeolocation({
              onData: (data) => updateReadingThrottled(key, data),
              onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
            });
          } else if (strategy.id === "Accelerometer") {
            stopFn = startGenericSensor({
              ctorName: "Accelerometer",
              options: { frequency: 60 },
              read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "m/s²" }),
              onData: (data) => updateReadingThrottled(key, data),
              onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
            });
          } else if (strategy.id === "LinearAccelerationSensor") {
            stopFn = startGenericSensor({
              ctorName: "LinearAccelerationSensor",
              options: { frequency: 60 },
              read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "m/s²" }),
              onData: (data) => updateReadingThrottled(key, data),
              onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
            });
          } else if (strategy.id === "GravitySensor") {
            stopFn = startGenericSensor({
              ctorName: "GravitySensor",
              options: { frequency: 60 },
              read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "m/s²" }),
              onData: (data) => updateReadingThrottled(key, data),
              onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
            });
          } else if (strategy.id === "Gyroscope") {
            stopFn = startGenericSensor({
              ctorName: "Gyroscope",
              options: { frequency: 60 },
              read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "rad/s" }),
              onData: (data) => updateReadingThrottled(key, data),
              onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
            });
          } else if (strategy.id === "AbsoluteOrientationSensor") {
            stopFn = startGenericSensor({
              ctorName: "AbsoluteOrientationSensor",
              options: { frequency: 60 },
              read: (s) => ({ quaternion: Array.from(s.quaternion || []), units: "unit quaternion" }),
              onData: (data) => updateReadingThrottled(key, data),
              onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
            });
          } else if (strategy.id === "RelativeOrientationSensor") {
            stopFn = startGenericSensor({
              ctorName: "RelativeOrientationSensor",
              options: { frequency: 60 },
              read: (s) => ({ quaternion: Array.from(s.quaternion || []), units: "unit quaternion" }),
              onData: (data) => updateReadingThrottled(key, data),
              onError: (err) => updateRow(key, { status: "error", error: safeError(err) }),
            });
          } else {
            throw new Error(`Unsupported strategy: ${strategy.id}`);
          }

          stopFnsRef.current.set(key, stopFn);
          updateRow(key, { status: "running", error: null });
          return;
        } catch (err) {
          lastErr = safeError(err);
        }
      }

      updateRow(key, { status: "error", error: lastErr || { name: "Error", message: "Failed to start." } });
    },
    [
      defs,
      detectSupport,
      ensureMotionPermission,
      ensureOrientationPermission,
      stop,
      updateReadingThrottled,
      updateRow,
    ]
  );

  const startAll = useCallback(async () => {
    await Promise.all([ensureMotionPermission(), ensureOrientationPermission()]);
    for (const def of defs) {
      await start(def.id);
    }
  }, [defs, ensureMotionPermission, ensureOrientationPermission, start]);

  useEffect(() => {
    setEnv({
      isSecureContext: typeof window !== "undefined" ? window.isSecureContext : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });

    const initial = {};
    for (const def of defs) {
      const supported = def.webStrategies.some((s) => detectSupport(s.id));
      initial[def.id] = {
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
  const orientation = defs.filter((d) => d.category === "Orientation");
  const location = defs.filter((d) => d.category === "Location");

  const renderRow = (def) => {
    const row = rows[def.id] || { status: "idle" };
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
        id={`sensor-${def.id}`}
        key={def.id}
        className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{def.label}</div>
              <Chip tone={tone}>{statusLabel}</Chip>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{def.id}</span>
            </div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {row.strategy ? `Using: ${row.strategy}` : `Strategies: ${def.webStrategies.map((s) => s.label).join(" • ")}`}
            </div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Android:</span> {def.android || "—"}{" "}
              <span className="mx-1">•</span> <span className="font-medium text-zinc-700 dark:text-zinc-300">iOS:</span>{" "}
              {def.ios || "—"}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => start(def.id)}
              disabled={!supported || isRunning}
              className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Start
            </button>
            <button
              type="button"
              onClick={() => stop(def.id)}
              disabled={!stopFnsRef.current.has(def.id)}
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

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100">Overview</div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="good">{defs.filter((d) => rows[d.id]?.status === "running").length} running</Chip>
            <Chip tone="bad">{defs.filter((d) => rows[d.id]?.status === "error").length} errors</Chip>
            <Chip tone="warn">{defs.filter((d) => rows[d.id]?.status === "unavailable").length} unavailable</Chip>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {defs.map((def) => {
            const row = rows[def.id] || { status: "idle", supported: false };
            const tone =
              row.status === "running"
                ? "good"
                : row.status === "error"
                  ? "bad"
                  : row.status === "unavailable"
                    ? "warn"
                    : row.supported
                      ? "neutral"
                      : "warn";

            const label =
              row.status === "running"
                ? "running"
                : row.status === "error"
                  ? "error"
                  : row.status === "unavailable"
                    ? "unavailable"
                    : row.supported
                      ? "ready"
                      : "unsupported";

            return (
              <a
                key={def.id}
                href={`#sensor-${def.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <Chip tone={tone}>{label}</Chip>
                <span className="max-w-[18rem] truncate">{def.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Motion</h2>
        <div className="mt-3 grid gap-4">{motion.map(renderRow)}</div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Orientation</h2>
        <div className="mt-3 grid gap-4">{orientation.map(renderRow)}</div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Location</h2>
        <div className="mt-3 grid gap-4">{location.map(renderRow)}</div>
      </section>
    </div>
  );
}
