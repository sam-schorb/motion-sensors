import { clamp } from "@/lib/motionMapper/filters";

export const CONTROL_SOURCES = [
  { id: "none", label: "None" },
  { id: "roll", label: "Roll (tilt left/right)" },
  { id: "pitch", label: "Pitch (tilt forward/back)" },
  { id: "yaw", label: "Yaw (turn left/right)" },
  { id: "lin", label: "Linear acceleration (magnitude)" },
  { id: "rot", label: "Rotational acceleration (rotation rate magnitude)" },
];

function toNormalizedSigned(vSigned, invert) {
  const v = clamp(Number(vSigned) || 0, -1, 1);
  const signed = invert ? -v : v;
  return 0.5 + 0.5 * signed;
}

function toNormalizedUnsigned(v01, invert) {
  const v = clamp(Number(v01) || 0, 0, 1);
  return invert ? 1 - v : v;
}

function canSetNow(lastSetAt, paramId, tMs, updateHz) {
  const minIntervalMs = 1000 / Math.max(1, updateHz);
  const last = lastSetAt.get(paramId) ?? -Infinity;
  if (tMs - last < minIntervalMs) return false;
  lastSetAt.set(paramId, tMs);
  return true;
}

export function createMappingEngine({
  rnbo,
  mapping: initialMapping,
  updateHz = 25,
} = {}) {
  const lastSetAt = new Map();
  let mapping = initialMapping || {};

  function setMapping(next) {
    mapping = next || {};
  }

  function apply(controls, tMs) {
    if (!rnbo) return;
    if (!controls) return;
    if (!mapping) return;

    for (const [paramId, spec] of Object.entries(mapping)) {
      const source = spec?.source || "none";
      if (source === "none") continue;
      if (!canSetNow(lastSetAt, paramId, tMs, updateHz)) continue;

      const invert = Boolean(spec?.invert);

      if (source === "roll" || source === "pitch" || source === "yaw") {
        const v = controls[source]; // signed [-1..1]
        const n = toNormalizedSigned(v, invert);
        rnbo.setParamNormalized?.(paramId, n);
      } else if (source === "lin" || source === "rot") {
        const v = controls[source]; // unsigned [0..1]
        const n = toNormalizedUnsigned(v, invert);
        rnbo.setParamNormalized?.(paramId, n);
      }
    }
  }

  return {
    apply,
    setMapping,
  };
}
