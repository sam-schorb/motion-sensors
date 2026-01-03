# CMSensorDataList

A list of recorded accelerometer samples returned by the system.

Availability: iOS 9.0+, iPadOS 9.0+, Mac Catalyst 13.1+, watchOS 2.0+

Declaration (Swift):
```swift
class CMSensorDataList
```

## Overview
You do not create CMSensorDataList yourself. It is returned by CMSensorRecorder when you request recorded accelerometer data. You can iterate over the list to process each CMRecordedAccelerometerData sample.

Example (Swift):
```swift
func processSamples(from start: Date, to end: Date) {
    let recorder = CMSensorRecorder()
    let list = recorder.accelerometerData(from: start, to: end)

    for sample in list {
        if let data = sample as? CMRecordedAccelerometerData {
            let x = data.acceleration.x
            let y = data.acceleration.y
            let z = data.acceleration.z
            // Use the recorded sample.
            print("Sample: (\(x), \(y), \(z))")
        }
    }
}
```

## Relationships
- Inherits From: NSObject
- Conforms To: CVarArg, CustomDebugStringConvertible, CustomStringConvertible, Equatable, Hashable, NSFastEnumeration, NSObjectProtocol
