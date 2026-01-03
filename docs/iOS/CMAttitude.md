# CMAttitude

Represents the device orientation relative to a chosen reference frame at a moment in time.

Availability: iOS 4.0+, iPadOS 4.0+, Mac Catalyst 13.1+, macOS 10.15+, visionOS 1.0+, watchOS 2.0+

Declaration (Swift):
```swift
class CMAttitude
```

## Overview
CMAttitude provides three mathematical forms of orientation: Euler angles (roll, pitch, yaw), a rotation matrix, and a quaternion.

You access CMAttitude instances through CMDeviceMotion.attitude. Device-motion samples are delivered after you start device-motion updates on CMMotionManager (for example, startDeviceMotionUpdates(using:to:withHandler:), startDeviceMotionUpdates(to:withHandler:), startDeviceMotionUpdates(using:), or startDeviceMotionUpdates()).

## Note
- Core Motion produces a direction cosine matrix (DCM), which represents the rotation from the previous orientation to the current one.

## API Reference

### Getting a Mathematical Representation of Attitude as Euler Angles
- roll: Roll angle, in radians.
- pitch: Pitch angle, in radians.
- yaw: Yaw angle, in radians.

### Getting a Mathematical Representation of Attitude as a Rotation Matrix
- rotationMatrix: The rotation matrix for the current attitude.
- CMRotationMatrix: The structure type for a rotation matrix.

### Getting a Mathematical Representation of Attitude as a Quaternion
- quaternion: The quaternion for the current attitude.
- CMQuaternion: The structure type for a quaternion.

### Obtaining the Change in Attitude
- multiply(byInverseOf:): Computes the relative change from another attitude.

## Relationships
- Inherits From: NSObject
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSCoding, NSCopying, NSObjectProtocol, NSSecureCoding
