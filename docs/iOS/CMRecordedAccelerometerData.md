# CMRecordedAccelerometerData

Represents a recorded accelerometer sample stored by the system.

Availability: iOS 9.0+, iPadOS 9.0+, Mac Catalyst 13.1+, visionOS 1.0+, watchOS 2.0+

Declaration (Swift):
```swift
class CMRecordedAccelerometerData
```

## Overview
You do not create CMRecordedAccelerometerData directly. Instead, request recorded samples from CMSensorRecorder; it returns CMRecordedAccelerometerData instances.

## API Reference

### Getting the Accelerometer Data
- startDate: The wall-clock time when the sample was recorded.
- identifier: The unique identifier for this recorded sample.

## Relationships
- Inherits From: CMAccelerometerData
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSCoding, NSCopying, NSObjectProtocol, NSSecureCoding
