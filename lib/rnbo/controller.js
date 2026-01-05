import { ensureRnboForPatcher } from "@/lib/rnbo/runtime";
import { listNumberParamDescriptors } from "@/lib/rnbo/params";
import { loadPatcherFromUrl } from "@/lib/rnbo/patcher";

function nowIso() {
  return new Date().toISOString();
}

function safeError(err) {
  if (!err) return { name: "Error", message: "Unknown error" };
  if (typeof err === "string") return { name: "Error", message: err };
  return {
    name: err?.name || "Error",
    message: err?.message || String(err),
    stack: err?.stack,
  };
}

export function createRnboController({
  patcherUrl,
  outputGain = 0.8,
  onStateUpdate,
  onLog,
}) {
  let audioContext = null;
  let gainNode = null;
  let device = null;
  let patcher = null;

  let state = {
    isSecureContext: typeof window !== "undefined" ? window.isSecureContext : null,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    rnbo: { status: "idle", version: null, src: null },
    audio: { status: "idle", state: null, sampleRate: null },
    patcher: { status: "idle", url: patcherUrl || null, rnboVersion: null },
    device: { status: "idle" },
    params: { status: "idle", count: 0, list: [] },
    lastUpdatedAt: null,
    error: null,
  };

  function log(msg) {
    onLog?.(`[${nowIso()}] ${msg}`);
  }

  function emit(patch) {
    state = { ...state, ...patch, lastUpdatedAt: nowIso() };
    onStateUpdate?.(state);
  }

  function emitDeep(path, patch) {
    emit({ [path]: { ...state[path], ...patch } });
  }

  async function ensureAudioContext() {
    if (!audioContext) {
      const WAContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new WAContext();
      gainNode = audioContext.createGain();
      gainNode.gain.value = outputGain;
      gainNode.connect(audioContext.destination);
      emitDeep("audio", {
        status: "created",
        state: audioContext.state,
        sampleRate: audioContext.sampleRate,
      });
      log("Created AudioContext and output gain node.");
    }

    if (audioContext.state !== "running") {
      await audioContext.resume();
      emitDeep("audio", { status: "running", state: audioContext.state });
      log("Resumed AudioContext.");
    }

    return audioContext;
  }

  async function stopAudio() {
    if (!audioContext) return;
    await audioContext.suspend();
    emitDeep("audio", { status: "suspended", state: audioContext.state });
    log("Suspended AudioContext.");
  }

  function clearDevice() {
    if (device) {
      try {
        device.node.disconnect();
      } catch {
        // ignore
      }
    }
    device = null;
    emitDeep("device", { status: "idle" });
    emitDeep("params", { status: "idle", count: 0, list: [] });
  }

  async function loadPatcher() {
    if (!patcherUrl) throw new Error("No patcherUrl configured.");
    emitDeep("patcher", { status: "loading", url: patcherUrl });
    patcher = await loadPatcherFromUrl(patcherUrl);
    const rnboVersion = patcher?.desc?.meta?.rnboversion || null;
    emitDeep("patcher", { status: "loaded", rnboVersion });
    log(`Loaded patcher JSON (${patcherUrl}).`);
    return patcher;
  }

  async function start() {
    emit({ error: null });
    try {
      // Resume audio immediately (important on iOS: must happen in a user gesture).
      await ensureAudioContext();

      if (!patcher) await loadPatcher();
      const rnbo = await ensureRnboForPatcher(patcher, {
        onStatus: (s) => emitDeep("rnbo", s),
      });

      clearDevice();

      emitDeep("device", { status: "creating" });
      const { createDevice } = rnbo;
      device = await createDevice({ context: audioContext, patcher });
      device.node.connect(gainNode);
      emitDeep("device", { status: "running" });
      log("Created RNBO device and connected to output.");

      const descParams = listNumberParamDescriptors(patcher);
      for (const p of descParams) {
        const param = device?.parametersById?.get(p.paramId) || null;
        if (!param) continue;
        if (p.initialValue == null) continue;
        try {
          param.value = p.initialValue;
        } catch {
          // ignore
        }
      }
      const list = descParams.map((p) => {
        const param = device?.parametersById?.get(p.paramId) || null;
        const value = param ? param.value : p.initialValue ?? null;
        return {
          id: p.paramId,
          name: p.name || p.paramId,
          displayName: p.displayName || p.name || p.paramId,
          type: p.type,
          min: p.minimum,
          max: p.maximum,
          steps: p.steps || 0,
          exponent: p.exponent || 1,
          unit: p.unit || null,
          initialValue: p.initialValue ?? null,
          value,
          connected: Boolean(param),
        };
      });

      emitDeep("params", { status: "ready", count: list.length, list });
      return { audioContext, device, patcher };
    } catch (err) {
      const e = safeError(err);
      emit({ error: e });
      emitDeep("device", { status: "error" });
      log(`Start failed: ${e.message}`);
      throw err;
    }
  }

  function setParamValue(paramId, value) {
    if (!device) return false;
    const p = device.parametersById?.get(paramId);
    if (!p) return false;
    try {
      p.value = value;
      if (state.params?.list?.length) {
        const nextList = state.params.list.map((entry) =>
          entry.id === paramId ? { ...entry, value } : entry
        );
        emitDeep("params", { list: nextList });
      }
      return true;
    } catch (err) {
      log(`Failed setting ${paramId}: ${err?.message || err}`);
      return false;
    }
  }

  function getState() {
    return state;
  }

  function destroy() {
    clearDevice();
    if (audioContext) {
      try {
        audioContext.close();
      } catch {
        // ignore
      }
      audioContext = null;
      gainNode = null;
      emitDeep("audio", { status: "closed", state: null, sampleRate: null });
    }
  }

  return {
    getState,
    start,
    stopAudio,
    setParamValue,
    destroy,
  };
}
