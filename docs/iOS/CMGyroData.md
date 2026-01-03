# CMGyroData

A single rotation-rate sample from the device gyroscope.

Availability: iOS 4.0+, iPadOS 4.0+, Mac Catalyst 13.1+, macOS 10.15+, visionOS 1.0+, watchOS 2.0+

Declaration (Swift):
```swift
class CMGyroData
```

## Overview
You receive CMGyroData after starting gyroscope updates with CMMotionManager (startGyroUpdates(to:withHandler:) or startGyroUpdates()).

## API Reference

### Getting the Rotation Rate
- rotationRate: The rotation rate measured by the gyroscope.
- CMRotationRate: The structure type for rotation-rate values.
- CMRotationRateData: A data object for a single rotation-rate measurement.
- CMRecordedRotationRateData: A data object for a recorded rotation-rate measurement at a specific time.

## Relationships
- Inherits From: CMLogItem
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSCoding, NSCopying, NSObjectProtocol, NSSecureCoding
