# Getting processed device-motion data

Use Core Motion's device-motion service to get sensor-fused motion values that remove environmental bias (for example, gravity).

## Overview
Core Motion can provide raw sensor values from accelerometers, gyroscopes, and magnetometers. Raw values are useful, but they often include components you do not want. For example, accelerometer readings include both gravity and user acceleration. Removing gravity requires additional data and processing.

The device-motion service performs that sensor fusion for you and exposes these processed values:
- The device attitude (orientation) in 3D space.
- An unbiased rotation rate.
- The gravity vector.
- User acceleration (acceleration with gravity removed).
- The magnetic-field vector.

Device motion combines data from multiple sensors. You can access it through CMMotionManager, CMHeadphoneMotionManager, or CMBatchedSensorManager.

If your app depends on specific hardware, declare those requirements in Info.plist using UIRequiredDeviceCapabilities (for example, accelerometer or gyroscope).

## Important
- On visionOS, device-motion data is available only when your app has an open immersive space (see ImmersiveSpace).

## Check for the availability of motion data
Device-motion data may be unavailable for different reasons. Before starting updates, check CMMotionManager.isDeviceMotionAvailable and ensure it is true. If it is false, starting updates will not deliver samples.

## Choose a frame of reference for interpreting attitude data
Attitude represents rotation around the device axes, and it is reported relative to a reference frame. You select the frame when you start device-motion updates.

The default frame is xArbitraryZVertical (Z is vertical and X/Y are tied to the device's initial orientation). Use xArbitraryZVertical or xArbitraryCorrectedZVertical when you want changes relative to the starting pose (for example, a golf-swing tracker). For navigation or compass behavior, use xMagneticNorthZVertical or xTrueNorthZVertical to align with magnetic or true north.

The chosen frame is stored in CMMotionManager.attitudeReferenceFrame and becomes the default for later services that do not explicitly specify a frame. When the device matches the reference frame, roll, pitch, and yaw are 0. As the device rotates, roll, pitch, and yaw move within -pi to pi radians.

A Core Motion diagram shows how roll, pitch, and yaw relate to the device axes. For axis orientation on specific devices, see CMMotionManager or CMHeadphoneMotionManager.

## Start device-motion updates
You can either pull the latest sample when you need it or receive a continuous stream via a handler. In both cases, set deviceMotionUpdateInterval to control the update rate. The maximum rate is hardware-dependent but typically at least 100 Hz; if you request a faster rate, Core Motion uses the maximum supported rate instead.

### Pull updates on your schedule
Start updates without a handler, then read CMMotionManager.deviceMotion when you need a sample. The example below configures 50 Hz updates and polls with a timer:

```swift
final class MotionController {
    private let motion = CMMotionManager()
    private var timer: Timer?

    func startDeviceMotion() {
        guard motion.isDeviceMotionAvailable else { return }
        motion.deviceMotionUpdateInterval = 1.0 / 50.0
        motion.showsDeviceMovementDisplay = true
        motion.startDeviceMotionUpdates(using: .xMagneticNorthZVertical)

        timer = Timer(timeInterval: 1.0 / 50.0, repeats: true) { [weak self] _ in
            guard let data = self?.motion.deviceMotion else { return }
            let roll = data.attitude.roll
            let pitch = data.attitude.pitch
            let yaw = data.attitude.yaw
            // Use roll, pitch, yaw.
        }
        RunLoop.current.add(timer!, forMode: .default)
    }
}
```

### Stream updates with a handler
Start updates with a handler on an OperationQueue to receive each sample as it arrives. Each sample includes a timestamp that you can use to drop stale values if needed.

```swift
final class MotionController {
    private let motion = CMMotionManager()
    private let queue = OperationQueue()

    func startQueuedUpdates() {
        guard motion.isDeviceMotionAvailable else { return }
        motion.deviceMotionUpdateInterval = 1.0 / 60.0
        motion.showsDeviceMovementDisplay = true
        motion.startDeviceMotionUpdates(using: .xMagneticNorthZVertical, to: queue) { data, error in
            guard let data = data, error == nil else { return }
            let roll = data.attitude.roll
            let pitch = data.attitude.pitch
            let yaw = data.attitude.yaw
            // Use roll, pitch, yaw.
        }
    }
}
```

## Stop device-motion updates
Always stop device-motion updates when you no longer need them to reduce power use. Stop updates when:
- Your app enters the background or becomes inactive.
- The user finishes the motion-dependent feature.
- You have collected the needed data.

If you do not need continuous updates, start the service, read what you need, and stop immediately.

## Figure (conceptual)
A Core Motion illustration highlights that gyroscopes measure rotation rate around the device's x, y, and z axes.
