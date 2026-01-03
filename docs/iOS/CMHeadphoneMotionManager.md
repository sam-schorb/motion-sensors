# CMHeadphoneMotionManager

Manages motion updates coming from supported headphones.

Availability: iOS 14.0+, iPadOS 14.0+, Mac Catalyst 14.0+, macOS 14.0+, watchOS 7.0+

Declaration (Swift):
```swift
class CMHeadphoneMotionManager
```

## Overview
Use this manager to check whether headphone motion data is supported, start and stop device-motion updates, and receive updates via a delegate or handler. Before starting updates, verify availability with isDeviceMotionAvailable.

The manager can also publish connection-status updates for supported headphones.

### Headphone coordinate axes
A Core Motion diagram shows the positive x, y, and z axes for supported headphones (such as AirPods Max and AirPods Pro). Use that orientation to interpret attitude values.

## Important
- On iOS and macOS, add NSMotionUsageDescription to your app's Info.plist. If the key is missing, the system terminates your app when you begin device-motion updates.

## API Reference

### Checking Availability
- isDeviceMotionAvailable: Whether headphone motion is supported on the current device.
- isDeviceMotionActive: Whether headphone motion updates are currently running.
- isConnectionStatusActive: Whether connection-status updates are currently running.
- authorizationStatus(): The current authorization status for headphone motion.

### Starting and Stopping Updates
- startDeviceMotionUpdates(): Start device-motion updates.
- startDeviceMotionUpdates(to:withHandler:): Start device-motion updates with a handler.
- startConnectionStatusUpdates(): Start connection-status updates.
- stopDeviceMotionUpdates(): Stop device-motion updates.
- stopConnectionStatusUpdates(): Stop connection-status updates.

### Getting the Delegate
- delegate: The delegate that receives motion and connection updates.
- CMHeadphoneMotionManagerDelegate: The protocol for handling headphone motion manager events.

### Getting Device-Motion Information
- deviceMotion: The most recent device-motion sample.

## Relationships
- Inherits From: NSObject
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSObjectProtocol
