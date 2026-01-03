export async function requestMotionPermissionIfNeeded() {
  if (typeof DeviceMotionEvent === "undefined") return { ok: false };
  if (typeof DeviceMotionEvent.requestPermission !== "function") return { ok: true };
  const result = await DeviceMotionEvent.requestPermission();
  return { ok: result === "granted" };
}

export async function requestOrientationPermissionIfNeeded() {
  if (typeof DeviceOrientationEvent === "undefined") return { ok: false };
  if (typeof DeviceOrientationEvent.requestPermission !== "function") return { ok: true };
  const result = await DeviceOrientationEvent.requestPermission();
  return { ok: result === "granted" };
}

