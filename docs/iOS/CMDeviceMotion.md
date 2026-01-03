# CMDeviceMotion

A container for device-motion measurements such as attitude, rotation rate, and acceleration.

Availability: iOS 4.0+, iPadOS 4.0+, Mac Catalyst 13.1+, macOS 10.15+, visionOS 1.0+, watchOS 2.0+

Declaration (Swift):
```swift
class CMDeviceMotion
```

## Overview
You receive CMDeviceMotion samples after starting device-motion updates on CMMotionManager (for example, startDeviceMotionUpdates(using:to:withHandler:), startDeviceMotionUpdates(to:withHandler:), startDeviceMotionUpdates(using:), or startDeviceMotionUpdates()).

The accelerometer measures the combined effect of gravity and the user's acceleration. Because Core Motion tracks attitude using both the gyroscope and the accelerometer, it can separate those components. CMDeviceMotion exposes both values via gravity and userAcceleration.

## API Reference

### Getting Attitude and Rotation Rate
- attitude: The device attitude (orientation) at the sample time.
- rotationRate: The device rotation rate at the sample time.

### Getting Acceleration Data
- gravity: The gravity vector in the device reference frame.
- userAcceleration: The acceleration attributable to the user (gravity removed).

### Getting the Calibrated Magnetic Field
- magneticField: The calibrated magnetic-field vector in device coordinates.
- CMCalibratedMagneticField: The magnetic-field vector plus calibration accuracy.
- CMMagneticFieldCalibrationAccuracy: Calibration accuracy for a magnetic-field estimate.

### Getting the Heading
- heading: Heading angle (degrees) relative to the active reference frame.

### Getting the Sensor Location
- sensorLocation: The location of the sensors used for device-motion calculations.
- CMDeviceMotion.SensorLocation: The available sensor locations.

## Relationships
- Inherits From: CMLogItem
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSCoding, NSCopying, NSObjectProtocol, NSSecureCoding
