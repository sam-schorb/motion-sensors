import { requestMotionPermissionIfNeeded, requestOrientationPermissionIfNeeded } from "@/lib/sensors/permissions";
import { createKeyedThrottle } from "@/lib/sensors/throttle";
import { nowIso, safeError } from "@/lib/sensors/utils";
import { startDeviceMotion } from "@/lib/sensors/strategies/deviceMotion";
import {
  startDeviceOrientationEuler,
  startDeviceOrientationQuaternion,
} from "@/lib/sensors/strategies/deviceOrientation";
import { startGeolocation } from "@/lib/sensors/strategies/geolocation";
import { isSensorConstructorAvailable, startGenericSensor } from "@/lib/sensors/strategies/genericSensor";
import { isDeviceMotionSupported } from "@/lib/sensors/strategies/deviceMotion";
import { isDeviceOrientationSupported } from "@/lib/sensors/strategies/deviceOrientation";
import { isGeolocationSupported } from "@/lib/sensors/strategies/geolocation";

function detectSupport(strategyId) {
  switch (strategyId) {
    case "Accelerometer":
    case "Gyroscope":
    case "GravitySensor":
    case "LinearAccelerationSensor":
    case "AbsoluteOrientationSensor":
    case "RelativeOrientationSensor":
      return isSensorConstructorAvailable(strategyId);
    case "DeviceMotion.accelerationIncludingGravity":
    case "DeviceMotion.acceleration":
    case "DeviceMotion.rotationRate":
    case "DeviceMotion.derivedGravity":
      return isDeviceMotionSupported();
    case "DeviceOrientation":
    case "DeviceOrientationQuaternion.absolute":
    case "DeviceOrientationQuaternion.relative":
      return isDeviceOrientationSupported();
    case "Geolocation":
      return isGeolocationSupported();
    default:
      return false;
  }
}

export function createSensorController({ defs, onRowUpdate }) {
  const stopFns = new Map();
  const permission = { motion: null, orientation: null };
  const shouldEmit = createKeyedThrottle({ minIntervalMs: 100 });

  function updateRow(id, patch) {
    onRowUpdate(id, patch);
  }

  function updateReadingThrottled(id, reading) {
    if (!shouldEmit(id)) return;
    updateRow(id, { reading, lastUpdatedAt: nowIso() });
  }

  function getEnv() {
    return {
      isSecureContext: typeof window !== "undefined" ? window.isSecureContext : null,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };
  }

  function getInitialRows() {
    const rows = {};
    for (const def of defs) {
      const supported = def.strategies.some((s) => detectSupport(s.id));
      rows[def.id] = {
        status: "idle",
        supported,
        strategy: null,
        lastUpdatedAt: null,
        reading: null,
        error: null,
      };
    }
    return rows;
  }

  function stop(id) {
    const stopFn = stopFns.get(id);
    if (stopFn) {
      stopFns.delete(id);
      try {
        stopFn();
      } catch {
        // ignore
      }
    }
    updateRow(id, { status: "stopped" });
  }

  function stopAll() {
    for (const [id, stopFn] of stopFns.entries()) {
      try {
        stopFn();
      } catch {
        // ignore
      }
      stopFns.delete(id);
      updateRow(id, { status: "stopped" });
    }
  }

  async function ensureMotionPermission() {
    if (!permission.motion) permission.motion = requestMotionPermissionIfNeeded();
    return permission.motion;
  }

  async function ensureOrientationPermission() {
    if (!permission.orientation) permission.orientation = requestOrientationPermissionIfNeeded();
    return permission.orientation;
  }

  async function start(id) {
    stop(id);

    const def = defs.find((d) => d.id === id);
    if (!def) return;

    const supportedStrategies = def.strategies.filter((s) => detectSupport(s.id));
    if (!supportedStrategies.length) {
      updateRow(id, {
        status: "unavailable",
        error: { name: "Unsupported", message: "No supported Web API for this sensor on this browser." },
      });
      return;
    }

    updateRow(id, { status: "starting", error: null, strategy: null });

    let lastErr = null;

    for (const strategy of supportedStrategies) {
      updateRow(id, { status: "starting", error: null, strategy: strategy.label });

      try {
        let stopFn = null;

        if (strategy.id.startsWith("DeviceMotion")) {
          const perm = await ensureMotionPermission();
          if (!perm.ok) throw new Error("Motion permission was not granted.");

          stopFn = startDeviceMotion({
            onData: (data) => {
              if (strategy.id === "DeviceMotion.accelerationIncludingGravity") {
                updateReadingThrottled(id, data.accelerationIncludingGravity);
              } else if (strategy.id === "DeviceMotion.acceleration") {
                updateReadingThrottled(id, data.acceleration);
              } else if (strategy.id === "DeviceMotion.rotationRate") {
                updateReadingThrottled(id, data.rotationRate);
              } else if (strategy.id === "DeviceMotion.derivedGravity") {
                const ag = data.accelerationIncludingGravity;
                const a = data.acceleration;
                if (!ag || !a) return;
                updateReadingThrottled(id, {
                  x: ag.x != null && a.x != null ? ag.x - a.x : null,
                  y: ag.y != null && a.y != null ? ag.y - a.y : null,
                  z: ag.z != null && a.z != null ? ag.z - a.z : null,
                  units: "m/s²",
                  note: "derived from DeviceMotion (includingGravity - acceleration)",
                });
              }
            },
            onError: (err) => updateRow(id, { error: safeError(err) }),
          });
        } else if (strategy.id === "DeviceOrientation") {
          const perm = await ensureOrientationPermission();
          if (!perm.ok) throw new Error("Orientation permission was not granted.");

          stopFn = startDeviceOrientationEuler({
            onData: (data) => updateReadingThrottled(id, data),
            onError: (err) => updateRow(id, { error: safeError(err) }),
          });
        } else if (strategy.id === "DeviceOrientationQuaternion.absolute") {
          const perm = await ensureOrientationPermission();
          if (!perm.ok) throw new Error("Orientation permission was not granted.");

          stopFn = startDeviceOrientationQuaternion({
            mode: "absolute",
            onData: (data) => updateReadingThrottled(id, data),
            onError: (err) => updateRow(id, { error: safeError(err) }),
          });
        } else if (strategy.id === "DeviceOrientationQuaternion.relative") {
          const perm = await ensureOrientationPermission();
          if (!perm.ok) throw new Error("Orientation permission was not granted.");

          stopFn = startDeviceOrientationQuaternion({
            mode: "relative",
            onData: (data) => updateReadingThrottled(id, data),
            onError: (err) => updateRow(id, { error: safeError(err) }),
          });
        } else if (strategy.id === "Geolocation") {
          stopFn = startGeolocation({
            onData: (data) => updateReadingThrottled(id, data),
            onError: (err) => updateRow(id, { status: "error", error: safeError(err) }),
          });
        } else if (strategy.id === "Accelerometer") {
          stopFn = startGenericSensor({
            ctorName: "Accelerometer",
            options: { frequency: 60 },
            read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "m/s²" }),
            onData: (data) => updateReadingThrottled(id, data),
            onError: (err) => updateRow(id, { status: "error", error: safeError(err) }),
          });
        } else if (strategy.id === "LinearAccelerationSensor") {
          stopFn = startGenericSensor({
            ctorName: "LinearAccelerationSensor",
            options: { frequency: 60 },
            read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "m/s²" }),
            onData: (data) => updateReadingThrottled(id, data),
            onError: (err) => updateRow(id, { status: "error", error: safeError(err) }),
          });
        } else if (strategy.id === "GravitySensor") {
          stopFn = startGenericSensor({
            ctorName: "GravitySensor",
            options: { frequency: 60 },
            read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "m/s²" }),
            onData: (data) => updateReadingThrottled(id, data),
            onError: (err) => updateRow(id, { status: "error", error: safeError(err) }),
          });
        } else if (strategy.id === "Gyroscope") {
          stopFn = startGenericSensor({
            ctorName: "Gyroscope",
            options: { frequency: 60 },
            read: (s) => ({ x: s.x, y: s.y, z: s.z, units: "rad/s" }),
            onData: (data) => updateReadingThrottled(id, data),
            onError: (err) => updateRow(id, { status: "error", error: safeError(err) }),
          });
        } else if (strategy.id === "AbsoluteOrientationSensor") {
          stopFn = startGenericSensor({
            ctorName: "AbsoluteOrientationSensor",
            options: { frequency: 60 },
            read: (s) => ({ quaternion: Array.from(s.quaternion || []), units: "unit quaternion" }),
            onData: (data) => updateReadingThrottled(id, data),
            onError: (err) => updateRow(id, { status: "error", error: safeError(err) }),
          });
        } else if (strategy.id === "RelativeOrientationSensor") {
          stopFn = startGenericSensor({
            ctorName: "RelativeOrientationSensor",
            options: { frequency: 60 },
            read: (s) => ({ quaternion: Array.from(s.quaternion || []), units: "unit quaternion" }),
            onData: (data) => updateReadingThrottled(id, data),
            onError: (err) => updateRow(id, { status: "error", error: safeError(err) }),
          });
        } else {
          throw new Error(`Unsupported strategy: ${strategy.id}`);
        }

        stopFns.set(id, stopFn);
        updateRow(id, { status: "running", error: null });
        return;
      } catch (err) {
        lastErr = safeError(err);
      }
    }

    updateRow(id, { status: "error", error: lastErr || { name: "Error", message: "Failed to start." } });
  }

  async function startAll() {
    await Promise.all([ensureMotionPermission(), ensureOrientationPermission()]);
    for (const def of defs) {
      await start(def.id);
    }
  }

  function destroy() {
    stopAll();
  }

  return {
    getEnv,
    getInitialRows,
    start,
    stop,
    startAll,
    stopAll,
    destroy,
  };
}
