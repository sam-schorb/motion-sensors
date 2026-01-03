# CMSensorRecorder

Records and retrieves accelerometer data captured by the system.

Availability: iOS 9.0+, iPadOS 9.0+, Mac Catalyst 13.1+, watchOS 2.0+

Declaration (Swift):
```swift
class CMSensorRecorder
```

## Overview
Use CMSensorRecorder to start recording accelerometer data for later analysis. After recording, you can query the stored samples and process them in your app.

To record, create a CMSensorRecorder instance and call recordAccelerometer(forDuration:). You do not need to explicitly stop recording; the system stops automatically when the requested duration elapses (unless another app extends the recording window).

Example: record 20 minutes of accelerometer data:
```swift
if CMSensorRecorder.isAccelerometerRecordingAvailable() {
    let recorder = CMSensorRecorder()
    recorder.recordAccelerometer(forDuration: 20 * 60) // 20 minutes
}
```

## Important
- Add NSMotionUsageDescription to your app's Info.plist and provide a usage string. This text is shown the first time the system asks for motion access. If the key is missing, the app crashes when you call this API.

## API Reference

### Checking the Availability of Sensor Recording
- isAccelerometerRecordingAvailable(): Whether recording is supported on this device.
- authorizationStatus(): The current authorization status for sensor recording.
- CMAuthorizationStatus: The authorization-status enum for motion features.
- isAuthorizedForRecording(): Whether the app is authorized to record sensor data.

### Recording Accelerometer Data
- recordAccelerometer(forDuration:): Begin recording for the specified duration.

### Retrieving Past Accelerometer Data
- accelerometerData(from:to:): Fetch recorded accelerometer data between two dates.

## Relationships
- Inherits From: NSObject
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSObjectProtocol
