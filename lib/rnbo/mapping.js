export function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function inverseLerp(a, b, v) {
  if (a === b) return 0;
  return (v - a) / (b - a);
}

export function mapRange(inMin, inMax, outMin, outMax, v) {
  const t = clamp(inverseLerp(inMin, inMax, v), 0, 1);
  return lerp(outMin, outMax, t);
}

// Takes any angle in degrees and maps it to a mirrored 0..1 ramp:
// 0..180 => 0..1, 180..360 => 1..0 (repeats).
export function mirroredAngle01(degrees) {
  const w = ((degrees % 360) + 360) % 360;
  const mirrored = w <= 180 ? w : 360 - w;
  return mirrored / 180;
}

