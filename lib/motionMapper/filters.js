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

