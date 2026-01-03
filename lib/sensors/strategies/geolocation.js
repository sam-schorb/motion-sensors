import { safeError } from "@/lib/sensors/utils";

export function isGeolocationSupported() {
  return typeof navigator !== "undefined" && !!navigator.geolocation;
}

export function startGeolocation({ onData, onError }) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not available in this browser");
  }

  const id = navigator.geolocation.watchPosition(
    (pos) => {
      const { coords, timestamp } = pos;
      onData({
        latitude: coords.latitude,
        longitude: coords.longitude,
        altitude: coords.altitude,
        accuracy: coords.accuracy,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
        timestamp,
      });
    },
    (err) => onError(safeError(err)),
    { enableHighAccuracy: true, maximumAge: 0 }
  );

  return () => navigator.geolocation.clearWatch(id);
}

