export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export function quatMultiply(a, b) {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export function quatConjugate(q) {
  return [-q[0], -q[1], -q[2], q[3]];
}

export function quatNormSquared(q) {
  return q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3];
}

export function quatInverse(q) {
  const n2 = quatNormSquared(q);
  if (!n2) return null;
  const c = quatConjugate(q);
  return [c[0] / n2, c[1] / n2, c[2] / n2, c[3] / n2];
}

export function quaternionFromDeviceOrientationDegrees({ alpha, beta, gamma }) {
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

