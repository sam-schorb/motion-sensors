# CMAltitudeData

Represents a relative altitude change sample.

Availability: iOS 8.0+, iPadOS 8.0+, Mac Catalyst 13.1+, watchOS 2.0+

Declaration (Swift):
```swift
class CMAltitudeData
```

## Overview
You do not create CMAltitudeData directly. Start relative or absolute altitude updates with CMAltimeter, and the altimeter delivers CMAltitudeData instances to your handler.

## API Reference

### Getting the Altitude Data
- relativeAltitude: Altitude change since the first reported sample, in meters.
- pressure: Barometric pressure in kilopascals.

## Relationships
- Inherits From: CMLogItem
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSCoding, NSCopying, NSObjectProtocol, NSSecureCoding
