export function createKeyedThrottle({ minIntervalMs }) {
  const last = new Map();

  return function shouldEmit(key) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const prev = last.get(key) ?? 0;
    if (now - prev < minIntervalMs) return false;
    last.set(key, now);
    return true;
  };
}

