# CMAttitudeReferenceFrame

Reference-frame options that define how attitude (roll, pitch, yaw) is reported.

Availability: iOS 4.0+, iPadOS 4.0+, Mac Catalyst 13.0+, macOS 10.15+, visionOS 1.0+, watchOS 2.0+

Declaration (Swift):
```swift
struct CMAttitudeReferenceFrame
```

## Overview
When Core Motion reports attitude, it does so relative to a specific frame of reference. You can query which frames are supported on the current device by calling availableAttitudeReferenceFrames().

When you start a service that allows choosing a frame, you must pick one that is supported. If a service does not let you explicitly select a frame, it uses CMMotionManager.attitudeReferenceFrame as its default.

## API Reference

### Reference Frames
- xArbitraryZVertical: Z axis is vertical; X axis is an arbitrary horizontal direction.
- xArbitraryCorrectedZVertical: Z axis is vertical with improved rotation accuracy; X axis is an arbitrary horizontal direction.
- xMagneticNorthZVertical: Z axis is vertical; X axis points to magnetic north.
- xTrueNorthZVertical: Z axis is vertical; X axis points to geographic (true) north.

### Initializers
- init(rawValue:): Create a value from a raw bitmask.

## Relationships
- Conforms To: BitwiseCopyable, Equatable, ExpressibleByArrayLiteral, OptionSet, RawRepresentable, Sendable, SendableMetatype, SetAlgebra
