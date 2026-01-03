import { quatInverse, quatMultiply, quaternionFromDeviceOrientationDegrees } from "@/lib/sensors/math/quaternion";
import { safeError } from "@/lib/sensors/utils";

export function isDeviceOrientationSupported() {
  return typeof DeviceOrientationEvent !== "undefined";
}

export function startDeviceOrientationEuler({ onData, onError }) {
  if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") {
    throw new Error("DeviceOrientationEvent is not available in this browser");
  }

  const handler = (e) => {
    try {
      onData({
        alpha: e.alpha ?? null,
        beta: e.beta ?? null,
        gamma: e.gamma ?? null,
        absolute: e.absolute ?? null,
        units: "degrees",
      });
    } catch (err) {
      onError(safeError(err));
    }
  };

  window.addEventListener("deviceorientation", handler);

  return () => {
    window.removeEventListener("deviceorientation", handler);
  };
}

export function startDeviceOrientationQuaternion({ mode, onData, onError }) {
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
      onError(safeError(err));
    }
  };

  window.addEventListener("deviceorientation", handler);

  return () => {
    window.removeEventListener("deviceorientation", handler);
  };
}

