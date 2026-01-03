export function nowIso() {
  return new Date().toISOString();
}

export function safeError(err) {
  if (!err) return { name: "Error", message: "Unknown error" };
  if (typeof err === "string") return { name: "Error", message: err };
  return {
    name: err.name || err.error?.name || "Error",
    message: err.message || err.error?.message || "Unknown error",
  };
}

export function isFunction(value) {
  return typeof value === "function";
}

