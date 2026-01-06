This is a Next.js (JavaScript) site that:

- Loads an RNBO `export.json` patch in the browser
- Lets you map each RNBO parameter to motion controls (Roll / Pitch / Yaw / LinAcc / RotAcc / None)
- Runs the patch and shows live sensor + parameter data

## Platforms

- Android (Chrome): Uses the Generic Sensor API (when available).
- iOS (Safari/Chrome): Uses `DeviceMotionEvent` / `DeviceOrientationEvent`.

## Dev

- `npm install`
- `npm run dev` (open `http://localhost:3000`)
