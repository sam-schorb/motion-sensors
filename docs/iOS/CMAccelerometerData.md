# CMAccelerometerData

A single accelerometer sample containing three-axis acceleration values.

Availability: iOS 4.0+, iPadOS 4.0+, Mac Catalyst 13.1+, macOS 10.15+, visionOS 1.0+, watchOS 2.0+

Declaration (Swift):
```swift
class CMAccelerometerData
```

## Overview
You receive CMAccelerometerData from the handler passed to CMMotionManager.startAccelerometerUpdates(to:withHandler:) or by reading CMMotionManager.accelerometerData after calling startAccelerometerUpdates().

CMAccelerometerData inherits from CMLogItem, which provides a timestamp for when the sample was taken.

## API Reference

### Accessing Accelerometer Data
- acceleration: The 3-axis acceleration vector.
- CMAcceleration: The structure type for 3-axis acceleration.

## Relationships
- Inherits From: CMLogItem
- Inherited By: CMRecordedAccelerometerData
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSCoding, NSCopying, NSObjectProtocol, NSSecureCoding
