# CMMotionManager

The central object for starting and managing Core Motion sensor services.

Availability: iOS 4.0+, iPadOS 4.0+, Mac Catalyst 13.1+, visionOS 1.0+, watchOS 2.0+

Declaration (Swift):
```swift
class CMMotionManager
```

## Overview
Use a CMMotionManager instance to start motion services and receive sensor data from the device. It can deliver four categories of motion information:

- Accelerometer data: instantaneous linear acceleration along the device's three axes.
- Gyroscope data: instantaneous rotation rate around the device's three axes.
- Magnetometer data: magnetic field measurements used to infer orientation relative to Earth.
- Device motion data: sensor-fused results such as user acceleration, attitude, rotation rate, gravity direction, and calibrated magnetic field values.

Device-motion data is processed by Core Motion's sensor-fusion algorithms to provide gravity, user acceleration, calibrated magnetic field, attitude, and rotation rate in a single stream.

You can either:
- Receive a continuous stream of updates via a handler block on an OperationQueue, or
- Start updates and pull the latest sample from a property when you need it (common in games).

When you no longer need data, call the matching stop method (stopAccelerometerUpdates(), stopGyroUpdates(), stopMagnetometerUpdates(), stopDeviceMotionUpdates()) to save power.

### Receive regular motion updates (push model)
Set the appropriate update interval and start updates with a handler block. The system delivers samples at the configured interval via the handler:
- Accelerometer: set accelerometerUpdateInterval, then call startAccelerometerUpdates(to:withHandler:). The handler receives CMAccelerometerData.
- Gyroscope: set gyroUpdateInterval, then call startGyroUpdates(to:withHandler:). The handler receives CMGyroData.
- Magnetometer: set magnetometerUpdateInterval, then call startMagnetometerUpdates(to:withHandler:). The handler receives CMMagnetometerData.
- Device motion: set deviceMotionUpdateInterval, then call startDeviceMotionUpdates(using:to:withHandler:) or startDeviceMotionUpdates(to:withHandler:). The handler receives CMDeviceMotion. The using: variant lets you pick a reference frame.

### Sample motion data periodically (pull model)
Start updates without a handler and read the latest sample when needed:
- Accelerometer: startAccelerometerUpdates(); read accelerometerData.
- Gyroscope: startGyroUpdates(); read gyroData.
- Magnetometer: startMagnetometerUpdates(); read magnetometerData.
- Device motion: startDeviceMotionUpdates() or startDeviceMotionUpdates(using:); read deviceMotion. The using: variant sets the reference frame.

### Check availability and active state
If a hardware feature is unavailable, starting its updates has no effect. Use the availability and active-state properties (for example, isGyroAvailable and isGyroActive) to verify capability and current status.

### Device coordinate axes
A Core Motion diagram shows the positive x, y, and z axes for iPhone, iPad, Apple Watch, and Apple Vision Pro. Use that orientation to interpret accelerometer, gyroscope, and attitude values correctly for each device family.

## Important
- Create only one CMMotionManager instance per app. Multiple instances can reduce the effective update rate for accelerometer and gyroscope data.

## API Reference

### Determining the Availability of Services
- isDeviceMotionAvailable: Whether device-motion service is supported on the current device.
- isAccelerometerAvailable: Whether an accelerometer is available.
- isGyroAvailable: Whether a gyroscope is available.
- isMagnetometerAvailable: Whether a magnetometer is available.

### Determining Which Services Are Active
- isDeviceMotionActive: Whether device-motion updates are currently running.
- isAccelerometerActive: Whether accelerometer updates are currently running.
- isGyroActive: Whether gyroscope updates are currently running.
- isMagnetometerActive: Whether magnetometer updates are currently running.

### Managing Device Motion Updates
- showsDeviceMovementDisplay: Controls whether the device-movement display appears.
- deviceMotionUpdateInterval: The interval, in seconds, for device-motion updates.
- startDeviceMotionUpdates(using:to:withHandler:): Start device-motion updates with a reference frame and handler on a queue.
- startDeviceMotionUpdates(to:withHandler:): Start device-motion updates with a handler on a queue.
- startDeviceMotionUpdates(using:): Start device-motion updates with a reference frame and no handler.
- startDeviceMotionUpdates(): Start device-motion updates without a handler.
- stopDeviceMotionUpdates(): Stop device-motion updates.
- deviceMotion: The most recent device-motion sample.
- CMDeviceMotionHandler: The handler type for device-motion updates.

### Managing Accelerometer Updates
- accelerometerUpdateInterval: The interval, in seconds, for accelerometer updates.
- startAccelerometerUpdates(to:withHandler:): Start accelerometer updates with a handler on a queue.
- startAccelerometerUpdates(): Start accelerometer updates without a handler.
- stopAccelerometerUpdates(): Stop accelerometer updates.
- accelerometerData: The most recent accelerometer sample.
- CMAccelerometerHandler: The handler type for accelerometer updates.

### Managing Gyroscope Updates
- gyroUpdateInterval: The interval, in seconds, for gyroscope updates.
- startGyroUpdates(to:withHandler:): Start gyroscope updates with a handler on a queue.
- startGyroUpdates(): Start gyroscope updates without a handler.
- stopGyroUpdates(): Stop gyroscope updates.
- gyroData: The most recent gyroscope sample.
- CMGyroHandler: The handler type for gyroscope updates.

### Managing Magnetometer Updates
- magnetometerUpdateInterval: The interval, in seconds, for magnetometer updates.
- startMagnetometerUpdates(to:withHandler:): Start magnetometer updates with a handler on a queue.
- startMagnetometerUpdates(): Start magnetometer updates without a handler.
- stopMagnetometerUpdates(): Stop magnetometer updates.
- magnetometerData: The most recent magnetometer sample.
- CMMagnetometerHandler: The handler type for magnetometer updates.

### Accessing Attitude Reference Frames
- attitudeReferenceFrame: The current or default attitude reference frame.
- availableAttitudeReferenceFrames(): Returns a bitmask of supported reference frames on this device.

### Understanding Errors
- CMErrorDomain: The Core Motion error domain.
- CMError: The Core Motion error codes.

## Relationships
- Inherits From: NSObject
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSObjectProtocol
