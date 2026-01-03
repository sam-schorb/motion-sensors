# Getting raw gyroscope events

Retrieve unprocessed rotation-rate samples from the device gyroscopes.

## Overview
A gyroscope measures how fast the device rotates around an axis. Many Apple devices include a 3-axis gyroscope, which reports rotation rates around x, y, and z. Values are in radians per second and can be positive or negative based on rotation direction.

You access gyroscope data through Core Motion, primarily using CMMotionManager. You can either pull the latest value when needed or receive every update on a queue. Choose the model that fits your app.

Raw gyroscope values can be biased (for example, due to temperature). If you need bias-corrected rotation rates, use device-motion updates instead.

For device axis orientation, see CMMotionManager.

## Important
- If your app requires a gyroscope, set UIRequiredDeviceCapabilities to include the "gyroscope" capability in Info.plist.
- On visionOS, gyroscope data is available only when your app has an open immersive space (see ImmersiveSpace).

## Check for the availability of gyroscope data
Before starting updates, check CMMotionManager.isGyroAvailable and ensure it is true. If it is false, starting updates will not deliver samples.

## Get gyroscope data only when you need it (pull model)
Use startGyroUpdates() to begin updates without a handler. Core Motion updates CMMotionManager.gyroData, but you must read it when needed.

Set gyroUpdateInterval to control the update rate. The maximum rate is hardware-dependent but typically at least 100 Hz. If you request a higher rate, Core Motion clamps to the supported maximum.

Example: poll at 50 Hz with a timer:

```swift
final class MotionController {
    private let motion = CMMotionManager()
    private var timer: Timer?

    func startGyroPolling() {
        guard motion.isGyroAvailable else { return }
        motion.gyroUpdateInterval = 1.0 / 50.0
        motion.startGyroUpdates()

        timer = Timer(timeInterval: 1.0 / 50.0, repeats: true) { [weak self] _ in
            guard let data = self?.motion.gyroData else { return }
            let x = data.rotationRate.x
            let y = data.rotationRate.y
            let z = data.rotationRate.z
            // Use x, y, z values.
        }
        RunLoop.current.add(timer!, forMode: .default)
    }

    func stopGyroPolling() {
        timer?.invalidate()
        timer = nil
        motion.stopGyroUpdates()
    }
}
```

## Process a steady stream of gyroscope updates (push model)
Use startGyroUpdates(to:withHandler:) when you need every sample. Core Motion enqueues each update on your OperationQueue, which helps avoid dropped samples when the app is busy.

```swift
final class GraphController {
    private let motion = CMMotionManager()
    private let gyroMin: TimeInterval = 0.01

    func startUpdates(sliderValue: Int) {
        let delta = 0.005
        let updateInterval = gyroMin + (delta * Double(sliderValue))
        guard motion.isGyroAvailable else { return }

        motion.gyroUpdateInterval = updateInterval
        motion.startGyroUpdates(to: .main) { data, error in
            guard let data = data, error == nil else { return }
            // Update UI with data.rotationRate.x/y/z
        }
    }

    func stopUpdates() {
        if motion.isGyroActive {
            motion.stopGyroUpdates()
        }
    }
}
```

## Figure (conceptual)
A Core Motion diagram shows gyroscopes measuring rotation rate around the device's x, y, and z axes.
