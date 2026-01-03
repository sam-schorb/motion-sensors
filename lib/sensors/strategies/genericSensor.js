import { safeError } from "@/lib/sensors/utils";

export function isSensorConstructorAvailable(name) {
  return typeof window !== "undefined" && typeof window[name] === "function";
}

export function startGenericSensor({ ctorName, options, read, onData, onError }) {
  if (!isSensorConstructorAvailable(ctorName)) {
    throw new Error(`${ctorName} is not available in this browser`);
  }

  const Ctor = window[ctorName];
  const sensor = new Ctor(options);

  const onReading = () => {
    try {
      onData(read(sensor));
    } catch (err) {
      onError(safeError(err));
    }
  };

  const onSensorError = (e) => onError(safeError(e?.error || e));

  sensor.addEventListener("reading", onReading);
  sensor.addEventListener("error", onSensorError);
  sensor.start();

  return () => {
    sensor.removeEventListener("reading", onReading);
    sensor.removeEventListener("error", onSensorError);
    try {
      sensor.stop();
    } catch {
      // ignore
    }
  };
}

