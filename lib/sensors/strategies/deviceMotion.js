import { safeError } from "@/lib/sensors/utils";

export function isDeviceMotionSupported() {
  return typeof DeviceMotionEvent !== "undefined";
}

export function startDeviceMotion({ onData, onError }) {
  if (typeof window === "undefined" || typeof DeviceMotionEvent === "undefined") {
    throw new Error("DeviceMotionEvent is not available in this browser");
  }

  const degreesToRad = (deg) => (typeof deg === "number" ? (deg * Math.PI) / 180 : null);

  const handler = (e) => {
    try {
      const a = e.acceleration || null;
      const ag = e.accelerationIncludingGravity || null;
      const rr = e.rotationRate || null;

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
    } catch (err) {
      onError(safeError(err));
    }
  };

  window.addEventListener("devicemotion", handler);

  return () => {
    window.removeEventListener("devicemotion", handler);
  };
}

