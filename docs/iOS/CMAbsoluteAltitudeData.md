# CMAbsoluteAltitudeData

Represents a change in absolute altitude.

Availability: iOS 15.0+, iPadOS 15.0+, Mac Catalyst 15.0+, visionOS 1.0+, watchOS 8.0+

Declaration (Swift):
```swift
class CMAbsoluteAltitudeData
```

## Overview
Absolute altitude is only available on iPhone 12 and later and Apple Watch Series 6 or Apple Watch SE and later.

## API Reference

### Accessing Altitude Data
- altitude: Absolute altitude above sea level, in meters.
- accuracy: Estimated uncertainty (one standard deviation), in meters.
- precision: Recommended resolution for altitude values, in meters.

## Relationships
- Inherits From: CMLogItem
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSCoding, NSCopying, NSObjectProtocol, NSSecureCoding
