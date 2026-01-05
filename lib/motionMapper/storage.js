import { fnv1a32, toHex32 } from "@/lib/motionMapper/hash";
import { listNumberParamDescriptors } from "@/lib/rnbo/params";

function stablePatchSignature(patcher) {
  const meta = patcher?.desc?.meta || {};
  const params = listNumberParamDescriptors(patcher).map((p) => ({
    id: p.paramId,
    min: p.minimum,
    max: p.maximum,
    exp: p.exponent || 1,
    steps: p.steps || 0,
  }));

  return JSON.stringify({
    rnboversion: meta.rnboversion || null,
    name: meta?.name || null,
    params,
  });
}

export function getPatchKey(patcher) {
  const sig = stablePatchSignature(patcher);
  return `rnboMotionMap:${toHex32(fnv1a32(sig))}`;
}

export function loadMappingFromStorage(patchKey) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(patchKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveMappingToStorage(patchKey, mapping) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(patchKey, JSON.stringify(mapping));
    return true;
  } catch {
    return false;
  }
}

