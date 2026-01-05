import { quatInverse, quatMultiply } from "@/lib/sensors/math/quaternion";
import { clamp, EmaFilter } from "@/lib/motionMapper/filters";

function safeQuat(q) {
  if (!Array.isArray(q) || q.length !== 4) return null;
  const out = q.map(Number);
  if (!out.every((n) => Number.isFinite(n))) return null;
  return out;
}

function ensureShortestQuat(q) {
  // q and -q represent the same rotation; choosing w>=0 ensures angle in [0..pi]
  return q[3] < 0 ? [-q[0], -q[1], -q[2], -q[3]] : q;
}

function quatToRotationVector(qIn) {
  const q = ensureShortestQuat(qIn);
  const [x, y, z, w] = q;
  const clampedW = clamp(w, -1, 1);
  const angle = 2 * Math.acos(clampedW); // radians, [0..pi]
  const s = Math.sqrt(Math.max(0, 1 - clampedW * clampedW)); // sin(angle/2)
  const eps = 1e-8;

  if (s < eps || angle === 0) {
    return { rx: 0, ry: 0, rz: 0, angleRad: 0 };
  }

  const ax = x / s;
  const ay = y / s;
  const az = z / s;
  return { rx: ax * angle, ry: ay * angle, rz: az * angle, angleRad: angle };
}

function vecMag(v) {
  if (!v) return null;

  // Generic Sensor values (x/y/z).
  if (typeof v.x === "number" || typeof v.y === "number" || typeof v.z === "number") {
    const x = typeof v.x === "number" ? v.x : null;
    const y = typeof v.y === "number" ? v.y : null;
    const z = typeof v.z === "number" ? v.z : null;
    if (![x, y, z].every((n) => Number.isFinite(n))) return null;
    return Math.sqrt(x * x + y * y + z * z);
  }

  // DeviceMotionEvent.rotationRate fallback (alpha/beta/gamma).
  const a = typeof v.alphaRadPerSec === "number" ? v.alphaRadPerSec : null;
  const b = typeof v.betaRadPerSec === "number" ? v.betaRadPerSec : null;
  const g = typeof v.gammaRadPerSec === "number" ? v.gammaRadPerSec : null;
  if (![a, b, g].every((n) => Number.isFinite(n))) return null;
  return Math.sqrt(a * a + b * b + g * g);
}

export function createMotionControls({
  orientationTau = 0.18,
  accelTau = 0.14,
  linAccMax = 15, // m/s²
  rotRateMax = 6, // rad/s
} = {}) {
  let baselineQuat = null;
  let lastQuatRaw = null;
  let lastLin = null;
  let lastRot = null;

  const fRoll = new EmaFilter({ tauSeconds: orientationTau });
  const fPitch = new EmaFilter({ tauSeconds: orientationTau });
  const fYaw = new EmaFilter({ tauSeconds: orientationTau });
  const fLin = new EmaFilter({ tauSeconds: accelTau });
  const fRot = new EmaFilter({ tauSeconds: accelTau });

  let lastRotVec = null;
  let last = {
    roll: 0,
    pitch: 0,
    yaw: 0,
    lin: 0,
    rot: 0,
  };

  function resetFilters() {
    fRoll.reset(null, null);
    fPitch.reset(null, null);
    fYaw.reset(null, null);
    fLin.reset(null, null);
    fRot.reset(null, null);
  }

  function recalibrate() {
    baselineQuat = lastQuatRaw ? lastQuatRaw : null;
    resetFilters();
  }

  function update({ tMs, quaternion, linearAcceleration, rotationRate }) {
    if (linearAcceleration) lastLin = linearAcceleration;
    if (rotationRate) lastRot = rotationRate;

    const qRaw = safeQuat(quaternion);
    if (qRaw) {
      lastQuatRaw = qRaw;
      if (!baselineQuat) baselineQuat = qRaw;
      const inv = quatInverse(baselineQuat);
      if (inv) {
        const qRel = quatMultiply(inv, qRaw);
        const rv = quatToRotationVector(qRel);
        lastRotVec = rv;

        const roll = clamp(rv.rx / Math.PI, -1, 1);
        const pitch = clamp(rv.ry / Math.PI, -1, 1);
        const yaw = clamp(rv.rz / Math.PI, -1, 1);

        last.roll = clamp(fRoll.update(roll, tMs), -1, 1);
        last.pitch = clamp(fPitch.update(pitch, tMs), -1, 1);
        last.yaw = clamp(fYaw.update(yaw, tMs), -1, 1);
      }
    }

    const linMag = vecMag(lastLin);
    const rotMag = vecMag(lastRot);

    const lin01 = linMag == null ? 0 : clamp(linMag / linAccMax, 0, 1);
    const rot01 = rotMag == null ? 0 : clamp(rotMag / rotRateMax, 0, 1);

    last.lin = clamp(fLin.update(lin01, tMs), 0, 1);
    last.rot = clamp(fRot.update(rot01, tMs), 0, 1);

    return {
      baseline: baselineQuat ? "set" : "unset",
      rotVec: lastRotVec,
      values: { ...last },
      mags: { lin: linMag, rot: rotMag },
    };
  }

  return {
    recalibrate,
    update,
    getSnapshot: () => ({
      baseline: baselineQuat ? "set" : "unset",
      rotVec: lastRotVec,
      values: { ...last },
    }),
  };
}

