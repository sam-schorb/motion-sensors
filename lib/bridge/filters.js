export function clamp(n, min, max) {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export class EmaFilter {
  constructor({ tauSeconds }) {
    this.tauSeconds = Math.max(0.0001, Number(tauSeconds) || 0.15);
    this._y = null;
    this._tMs = null;
  }

  reset(value = null, tMs = null) {
    this._y = value;
    this._tMs = tMs;
  }

  update(x, tMs) {
    if (!Number.isFinite(x)) return this._y;
    if (this._y == null || this._tMs == null || !Number.isFinite(tMs)) {
      this._y = x;
      this._tMs = tMs;
      return this._y;
    }

    const dt = Math.max(0, (tMs - this._tMs) / 1000);
    this._tMs = tMs;

    const alpha = 1 - Math.exp(-dt / this.tauSeconds);
    this._y = this._y + alpha * (x - this._y);
    return this._y;
  }

  get value() {
    return this._y;
  }
}

export class QuantizedDwell {
  constructor({ min = 0, max = 7, dwellMs = 140 } = {}) {
    this.min = min;
    this.max = max;
    this.dwellMs = dwellMs;
    this._current = null;
    this._pending = null;
    this._pendingSinceMs = null;
  }

  reset(value = null) {
    this._current = value;
    this._pending = null;
    this._pendingSinceMs = null;
  }

  update(targetInt, tMs) {
    const v = Math.round(clamp(targetInt, this.min, this.max));
    if (this._current == null) {
      this._current = v;
      return this._current;
    }

    if (v === this._current) {
      this._pending = null;
      this._pendingSinceMs = null;
      return this._current;
    }

    if (this._pending !== v) {
      this._pending = v;
      this._pendingSinceMs = tMs;
      return this._current;
    }

    if (this._pendingSinceMs != null && tMs - this._pendingSinceMs >= this.dwellMs) {
      this._current = this._pending;
      this._pending = null;
      this._pendingSinceMs = null;
    }

    return this._current;
  }

  get value() {
    return this._current;
  }
}

