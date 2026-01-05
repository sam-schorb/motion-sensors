export function listNumberParamDescriptors(patcher) {
  const allParams = patcher?.desc?.parameters || [];
  return allParams.filter((p) => p.type === "ParameterTypeNumber" && p.visible !== false);
}

export function deriveSliderStep(min, max, steps) {
  if (typeof steps === "number" && steps > 1) return (max - min) / (steps - 1);
  const range = max - min;
  if (range <= 1) return 0.001;
  if (Number.isInteger(min) && Number.isInteger(max) && range >= 2 && range <= 2048) return 1;
  if (range <= 10) return 0.01;
  if (range <= 100) return 0.1;
  return 1;
}

export function fmtNumber(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs === 0) return "0";
  if (abs >= 1000) return n.toFixed(0);
  if (abs >= 100) return n.toFixed(1);
  if (abs >= 10) return n.toFixed(2);
  return n.toFixed(4);
}

