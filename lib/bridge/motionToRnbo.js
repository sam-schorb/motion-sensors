import { quatInverse, quatMultiply } from "@/lib/sensors/math/quaternion";
import { clamp, EmaFilter, QuantizedDwell } from "@/lib/bridge/filters";

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

  return {
    rx: ax * angle,
    ry: ay * angle,
    rz: az * angle,
    angleRad: angle,
  };
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
  let lastRotVec = null;
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
    let rotVec = null;
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
        rotVec = quatToRotationVector(qRel);
        lastRotVec = rotVec;
        x01 = clamp(Math.abs(rotVec.rx) / Math.PI, 0, 1);
        y01 = clamp(Math.abs(rotVec.ry) / Math.PI, 0, 1);
        z01 = clamp(Math.abs(rotVec.rz) / Math.PI, 0, 1);
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
      if (canSetNow("envLength", tMs)) rnbo?.setParamNormalized?.("envLength", sy);
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
        rotVec: rotVec || lastRotVec,
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
      rotVec: lastRotVec,
      controls: lastControls,
    }),
  };
}
