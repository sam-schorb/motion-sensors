# CMAltimeter

Starts and manages delivery of relative and absolute altitude updates.

Availability: iOS 8.0+, iPadOS 8.0+, Mac Catalyst 13.1+, watchOS 2.0+

Declaration (Swift):
```swift
class CMAltimeter
```

## Overview
Altitude updates report changes in relative and absolute altitude. For example, a hiking app can track elevation change over time or show the current absolute altitude.

Because not all devices support these features, check availability first:
- Use isRelativeAltitudeAvailable() before starting relative altitude updates.
- Use isAbsoluteAltitudeAvailable() before starting absolute altitude updates.

After verifying availability, start updates with startRelativeAltitudeUpdates(to:withHandler:) or startAbsoluteAltitudeUpdates(to:withHandler:). Core Motion delivers samples at regular intervals even if the value has not changed. When you are finished, call stopRelativeAltitudeUpdates() or stopAbsoluteAltitudeUpdates() to stop the stream.

## Important
- Add NSMotionUsageDescription to your app's Info.plist and provide a usage string. If the key is missing, the app crashes when you call this API.

## API Reference

### Determining Altitude Availability
- isAbsoluteAltitudeAvailable(): Whether the device can report absolute altitude changes.
- isRelativeAltitudeAvailable(): Whether the device can report relative altitude changes.
- authorizationStatus(): The current authorization status for altimeter data.
- CMAuthorizationStatus: The authorization-status enum for motion features.

### Starting and Stopping Altitude Updates
- startAbsoluteAltitudeUpdates(to:withHandler:): Start absolute altitude updates.
- stopAbsoluteAltitudeUpdates(): Stop absolute altitude updates.
- CMAbsoluteAltitudeHandler: The handler type for absolute altitude samples.
- startRelativeAltitudeUpdates(to:withHandler:): Start relative altitude updates.
- stopRelativeAltitudeUpdates(): Stop relative altitude updates.
- CMAltitudeHandler: The handler type for relative altitude samples.

## Relationships
- Inherits From: NSObject
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSObjectProtocol
