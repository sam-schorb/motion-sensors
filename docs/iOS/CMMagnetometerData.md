# CMMagnetometerData

Raw measurements of the Earth's magnetic field in device coordinates.

Availability: iOS 5.0+, iPadOS 5.0+, Mac Catalyst 13.1+, macOS 10.15+, watchOS 2.0+

Declaration (Swift):
```swift
class CMMagnetometerData
```

## Overview
You receive CMMagnetometerData either from the handler passed to CMMotionManager.startMagnetometerUpdates(to:withHandler:) or by reading CMMotionManager.magnetometerData after starting magnetometer updates.

## Note
- CMMotionManager.magnetometerData is non-nil only after you have started magnetometer updates.

## API Reference

### Getting the Field Strength
- magneticField: The magnetic-field vector measured by the magnetometer.
- CMMagneticField: The structure type for 3-axis magnetic-field values.

## Relationships
- Inherits From: CMLogItem
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSCoding, NSCopying, NSObjectProtocol, NSSecureCoding
