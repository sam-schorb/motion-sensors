# iOS Core Motion Documentation (Swift)

This folder contains a curated, Swift-focused documentation set for the iOS Core Motion API. The content is organized into two layers:

1) **Section overview files**: high-level entry points that describe each Core Motion topic group.
2) **Symbol/article files**: detailed pages for specific classes, structs, and articles.

All pages are written in Swift terminology (no Objective-C snippets) and are intended to be read as a complete, standalone reference for the selected Core Motion surface area.

## Structure

### Section overview files
These provide context for a topic area and link the items you should read next:

- `docs/iOS/device-motion.md` – Entry point for device-motion APIs.
- `docs/iOS/accelerometers.md` – Entry point for accelerometer APIs.
- `docs/iOS/gyroscopes.md` – Entry point for gyroscope APIs.
- `docs/iOS/magnetometer.md` – Entry point for magnetometer APIs.
- `docs/iOS/altitude-data.md` – Entry point for altitude APIs.

### Articles (task-focused guides)
These explain how to use a service and include Swift-only examples:

- `docs/iOS/getting-processed-device-motion-data.md` – Device-motion (sensor-fused) updates.
- `docs/iOS/getting-raw-accelerometer-events.md` – Raw accelerometer updates.
- `docs/iOS/getting-raw-gyroscope-events.md` – Raw gyroscope updates.

### Symbols (API reference pages)
These describe the Core Motion types, their purpose, and key properties/methods:

- `docs/iOS/CMMotionManager.md`
- `docs/iOS/CMDeviceMotion.md`
- `docs/iOS/CMAttitude.md`
- `docs/iOS/CMAttitudeReferenceFrame.md`
- `docs/iOS/CMHeadphoneMotionManager.md`
- `docs/iOS/CMAccelerometerData.md`
- `docs/iOS/CMRecordedAccelerometerData.md`
- `docs/iOS/CMSensorRecorder.md`
- `docs/iOS/CMSensorDataList.md`
- `docs/iOS/CMGyroData.md`
- `docs/iOS/CMMagnetometerData.md`
- `docs/iOS/CMAltimeter.md`
- `docs/iOS/CMAbsoluteAltitudeData.md`
- `docs/iOS/CMAltitudeData.md`

## Recommended reading order

1) Start with the relevant section overview (for example, `docs/iOS/device-motion.md`).
2) Read the matching article (for example, `docs/iOS/getting-processed-device-motion-data.md`).
3) Dive into the symbol pages for the concrete API details.

## Naming conventions

- **Section overview files** use kebab-case names (for example, `device-motion.md`).
- **Articles** use kebab-case names starting with `getting-`.
- **Symbols** use the exact type name (for example, `CMMotionManager.md`).

## Scope

This documentation set includes only the Core Motion sections explicitly listed in the project request. It does not cover other Core Motion areas such as activity, pedometer, water submersion, or fall detection.
