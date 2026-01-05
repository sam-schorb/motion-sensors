let rnboLoadedVersion = null;
let rnboLoadPromise = null;

function getPatcherRnboVersion(patcher) {
  const version = patcher?.desc?.meta?.rnboversion;
  return typeof version === "string" && version.trim() ? version.trim() : null;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-rnbo-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Failed to load script: ${src}`)),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.dataset.rnboSrc = src;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

function getCdnSrc(version) {
  if (!version || version === "latest") return "https://cdn.cycling74.com/rnbo/latest/rnbo.min.js";
  return `https://js.cdn.cycling74.com/rnbo/${version}/rnbo.min.js`;
}

export function getLoadedRnboVersion() {
  return rnboLoadedVersion;
}

export async function ensureRnboForPatcher(patcher, { onStatus } = {}) {
  if (typeof window === "undefined") throw new Error("RNBO runtime can only be loaded in the browser.");

  const required = getPatcherRnboVersion(patcher);
  const requested = required || "latest";

  if (window.RNBO) {
    if (required && rnboLoadedVersion && rnboLoadedVersion !== required) {
      throw new Error(
        `RNBO.js v${rnboLoadedVersion} already loaded, but patcher requires v${required}. Reload the page to switch versions.`
      );
    }
    rnboLoadedVersion = rnboLoadedVersion || required || "unknown";
    onStatus?.({ status: "loaded", version: rnboLoadedVersion, src: null });
    return window.RNBO;
  }

  const src = getCdnSrc(requested);
  onStatus?.({ status: "loading", version: requested, src });

  if (!rnboLoadPromise) {
    rnboLoadPromise = loadScript(src).finally(() => {
      rnboLoadPromise = null;
    });
  }
  await rnboLoadPromise;

  if (!window.RNBO) throw new Error("RNBO loaded but global RNBO object is missing.");
  rnboLoadedVersion = required || "latest";
  onStatus?.({ status: "loaded", version: rnboLoadedVersion, src });
  return window.RNBO;
}

