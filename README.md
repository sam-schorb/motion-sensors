This is a Next.js (JavaScript) site that reads motion/orientation/location sensors in the browser and displays:

- Which supported sensor APIs are available on the current device/browser
- Live sensor readings (when available)
- Errors/permission issues (when blocked)

## Platforms

- Android (Chrome): Uses the Generic Sensor API (when available).
- iOS (Safari/Chrome): Uses `DeviceMotionEvent` / `DeviceOrientationEvent`
