import { mirroredAngle01 } from "@/lib/rnbo/mapping";
import { quatInverse, quatMultiply } from "@/lib/sensors/math/quaternion";
import { clamp, EmaFilter, QuantizedDwell } from "@/lib/bridge/filters";

function safeQuat(q) {
  if (!Array.isArray(q) || q.length !== 4) return null;
  const out = q.map(Number);
  if (!out.every((n) => Number.isFinite(n))) return null;
  return out;
}

function quatToEulerDegXYZ(q) {
  const [x, y, z, w] = q;

  // roll (x-axis rotation)
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  // pitch (y-axis rotation)
  const sinp = 2 * (w * y - z * x);
  const pitch = Math.asin(clamp(sinp, -1, 1));

  // yaw (z-axis rotation)
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  const rad2deg = 180 / Math.PI;
  return {
    x: roll * rad2deg,
    y: pitch * rad2deg,
    z: yaw * rad2deg,
  };
}

function to360(deg) {
  if (!Number.isFinite(deg)) return null;
  const w = ((deg % 360) + 360) % 360;
  return w;
}

function vecMag(v) {
  if (!v) return null;
  const x = typeof v.x === "number" ? v.x : null;
  const y = typeof v.y === "number" ? v.y : null;
  const z = typeof v.z === "number" ? v.z : null;
  if (![x, y, z].every((n) => Number.isFinite(n))) return null;
  return Math.sqrt(x * x + y * y + z * z);
}

export function createMotionToRnboBridge({
  rnbo,
  onDebug,
  config,
} = {}) {
  const cfg = {
    enabled: true,
    updateHz: 25,
    debugHz: 8,
    linAccMax: 15, // m/s²
    rotRateMax: 6, // rad/s
    smoothing: {
      orientationTau: 0.18,
      accelTau: 0.14,
    },
    ...config,
  };

  let enabled = Boolean(cfg.enabled);
  let lastSetAt = new Map();
  let lastDebugAtMs = -Infinity;

  let baselineQuat = null;
  let lastQuatRaw = null;
  let lastLin = null;
  let lastRot = null;
  let lastEulerDeg = null;
  let lastControls = null;

  const fX = new EmaFilter({ tauSeconds: cfg.smoothing.orientationTau });
  const fY = new EmaFilter({ tauSeconds: cfg.smoothing.orientationTau });
  const fZ = new EmaFilter({ tauSeconds: cfg.smoothing.orientationTau });
  const fLin = new EmaFilter({ tauSeconds: cfg.smoothing.accelTau });
  const fRot = new EmaFilter({ tauSeconds: cfg.smoothing.accelTau });

  const seqLenQuant = new QuantizedDwell({ min: 0, max: 7, dwellMs: 160 });
  const offsetQuant = new QuantizedDwell({ min: 0, max: 12, dwellMs: 120 });

  function resetFilters() {
    fX.reset(null, null);
    fY.reset(null, null);
    fZ.reset(null, null);
    fLin.reset(null, null);
    fRot.reset(null, null);
    seqLenQuant.reset(null);
    offsetQuant.reset(null);
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    onDebug?.({ enabled, note: enabled ? "enabled" : "disabled" });
  }

  function recalibrate({ tMs } = {}) {
    baselineQuat = lastQuatRaw ? lastQuatRaw : null;
    resetFilters();
    onDebug?.({
      enabled,
      recalibratedAtMs: tMs ?? null,
      note: baselineQuat ? "baseline set from latest quaternion" : "baseline will arm on next quaternion update",
    });
  }

  function canSetNow(paramId, tMs) {
    const minIntervalMs = 1000 / Math.max(1, cfg.updateHz);
    const last = lastSetAt.get(paramId) ?? -Infinity;
    if (tMs - last < minIntervalMs) return false;
    lastSetAt.set(paramId, tMs);
    return true;
  }

  function tick({ tMs, linearAcceleration, rotationRate, quaternion }) {
    if (!enabled) return;

    let qRel = null;
    let euler = null;
    let x01 = null;
    let y01 = null;
    let z01 = null;

    const qRaw = safeQuat(quaternion);
    if (qRaw) {
      lastQuatRaw = qRaw;
      if (!baselineQuat) baselineQuat = qRaw;
      const inv = quatInverse(baselineQuat);
      if (inv) qRel = quatMultiply(inv, qRaw);
      if (qRel) {
        euler = quatToEulerDegXYZ(qRel);
        lastEulerDeg = euler;
        x01 = mirroredAngle01(to360(euler.x));
        y01 = mirroredAngle01(to360(euler.y));
        z01 = mirroredAngle01(to360(euler.z));
      }
    }

    if (linearAcceleration) lastLin = linearAcceleration;
    if (rotationRate) lastRot = rotationRate;

    const linMag = vecMag(lastLin);
    const rotMag = vecMag(lastRot);

    const lin01 = linMag == null ? null : clamp(linMag / cfg.linAccMax, 0, 1);
    const rot01 = rotMag == null ? null : clamp(rotMag / cfg.rotRateMax, 0, 1);

    const sx = x01 == null ? null : clamp(fX.update(x01, tMs), 0, 1);
    const sy = y01 == null ? null : clamp(fY.update(y01, tMs), 0, 1);
    const sz = z01 == null ? null : clamp(fZ.update(z01, tMs), 0, 1);
    const slin = lin01 == null ? null : clamp(fLin.update(lin01, tMs), 0, 1);
    const srot = rot01 == null ? null : clamp(fRot.update(rot01, tMs), 0, 1);

    lastControls = { sx, sy, sz, slin, srot };

    // Map controls → RNBO params (normalized where possible)
    // X → metroRate (more rotation => faster/higher)
    if (sx != null && canSetNow("metroRate", tMs)) rnbo?.setParamNormalized?.("metroRate", sx);

    // Y → seqlength (quantized) + freq (normalized)
    if (sy != null) {
      if (canSetNow("freq", tMs)) rnbo?.setParamNormalized?.("freq", sy);
      const targetSeq = Math.round(sy * 7);
      const seq = seqLenQuant.update(targetSeq, tMs);
      if (seq != null && canSetNow("seqlength", tMs)) rnbo?.setParamValue?.("seqlength", seq);
    }

    // Z → offset (quantized)
    if (sz != null) {
      const targetOffset = Math.round(sz * 12);
      const off = offsetQuant.update(targetOffset, tMs);
      if (off != null && canSetNow("offset", tMs)) rnbo?.setParamValue?.("offset", off);
    }

    // LinAcc magnitude → delay (normalized)
    if (slin != null && canSetNow("delay", tMs)) rnbo?.setParamNormalized?.("delay", slin);

    // RotRate magnitude → degrade (normalized)
    if (srot != null && canSetNow("degrade", tMs)) rnbo?.setParamNormalized?.("degrade", srot);

    const debugIntervalMs = 1000 / Math.max(1, cfg.debugHz);
    if (onDebug && tMs - lastDebugAtMs >= debugIntervalMs) {
      lastDebugAtMs = tMs;
      onDebug({
        enabled,
        tMs,
        baseline: baselineQuat ? "set" : "unset",
        eulerDeg: euler || lastEulerDeg,
        mags: { lin: linMag, rot: rotMag },
        controls: lastControls,
      });
    }
  }

  return {
    setEnabled,
    recalibrate,
    tick,
    getDebugSnapshot: () => ({
      enabled,
      baseline: baselineQuat ? "set" : "unset",
      eulerDeg: lastEulerDeg,
      controls: lastControls,
    }),
  };
}
