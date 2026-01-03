# Getting raw accelerometer events

Retrieve unprocessed accelerometer samples from the device hardware.

## Overview
An accelerometer measures changes in velocity along an axis. Apple devices provide a 3-axis accelerometer, so you receive values for x, y, and z. Accelerometer values are expressed in units of g; a value of 1.0 corresponds to roughly 9.8 m/s^2 in that direction. Values can be positive or negative depending on direction.

You access accelerometer data through Core Motion, primarily using CMMotionManager. Choose a pull model (read samples when needed) or a push model (receive every update on a queue). Each approach has different configuration and performance tradeoffs.

For device axis orientation, see CMMotionManager.

## Important
- If your app requires an accelerometer, set UIRequiredDeviceCapabilities to include the "accelerometer" capability in Info.plist.
- On visionOS, accelerometer data is available only when your app has an open immersive space (see ImmersiveSpace).

## Check for the availability of accelerometer data
Before starting updates, check CMMotionManager.isAccelerometerAvailable and ensure it is true. If it is false, starting updates will not deliver samples.

## Get accelerometer data only when you need it (pull model)
Use startAccelerometerUpdates() to begin updates without a handler. Core Motion updates CMMotionManager.accelerometerData, but it does not notify you; you must read the property when you need a value.

Set accelerometerUpdateInterval to choose an update rate. The maximum rate is hardware-dependent but typically at least 100 Hz. If you request a faster rate, Core Motion clamps to the maximum supported rate.

Example: configure 50 Hz updates and poll with a timer at the same rate (polling slower wastes power because the hardware still produces unused samples):

```swift
final class MotionController {
    private let motion = CMMotionManager()
    private var timer: Timer?

    func startAccelerometerPolling() {
        guard motion.isAccelerometerAvailable else { return }
        motion.accelerometerUpdateInterval = 1.0 / 50.0
        motion.startAccelerometerUpdates()

        timer = Timer(timeInterval: 1.0 / 50.0, repeats: true) { [weak self] _ in
            guard let data = self?.motion.accelerometerData else { return }
            let x = data.acceleration.x
            let y = data.acceleration.y
            let z = data.acceleration.z
            // Use x, y, z values.
        }
        RunLoop.current.add(timer!, forMode: .default)
    }
}
```

## Process a steady stream of accelerometer data (push model)
When you need every sample (for example, for analysis), use startAccelerometerUpdates(to:withHandler:). Core Motion queues each sample onto the specified OperationQueue, which helps you avoid dropping data during brief busy periods.

You still set accelerometerUpdateInterval to control the update rate, and Core Motion enforces the maximum supported rate.

Example: update a graph on the main queue with a slider-controlled update rate:

```swift
final class GraphController {
    private let motion = CMMotionManager()
    private let accelerometerMin: TimeInterval = 0.01

    func startUpdates(sliderValue: Int) {
        let delta = 0.005
        let updateInterval = accelerometerMin + (delta * Double(sliderValue))
        guard motion.isAccelerometerAvailable else { return }

        motion.accelerometerUpdateInterval = updateInterval
        motion.startAccelerometerUpdates(to: .main) { data, error in
            guard let data = data, error == nil else { return }
            // Update UI with data.acceleration.x/y/z
        }

        // Update any UI labels with updateInterval if needed.
    }

    func stopUpdates() {
        if motion.isAccelerometerActive {
            motion.stopAccelerometerUpdates()
        }
    }
}
```

## Figure (conceptual)
A Core Motion diagram shows accelerometers measuring changes in velocity along the x, y, and z axes.
