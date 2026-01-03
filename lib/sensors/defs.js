export const SENSOR_DEFS = [
  {
    id: "gravity",
    category: "Motion",
    label: "Gravity",
    android: "TYPE_GRAVITY",
    ios: "CMDeviceMotion.gravity",
    strategies: [
      { id: "GravitySensor", label: "Generic Sensor: GravitySensor" },
      { id: "DeviceMotion.derivedGravity", label: "DeviceMotion: derived (incl. gravity - linear accel)" },
    ],
  },
  {
    id: "linear_acceleration",
    category: "Motion",
    label: "Linear acceleration",
    android: "TYPE_LINEAR_ACCELERATION",
    ios: "CMDeviceMotion.userAcceleration",
    strategies: [
      { id: "LinearAccelerationSensor", label: "Generic Sensor: LinearAccelerationSensor" },
      { id: "DeviceMotion.acceleration", label: "DeviceMotion: acceleration" },
    ],
  },
  {
    id: "rotation_rate",
    category: "Motion",
    label: "Rotation rate (gyroscope)",
    android: "TYPE_GYROSCOPE",
    ios: "CMGyroData / CMDeviceMotion.rotationRate",
    strategies: [
      { id: "Gyroscope", label: "Generic Sensor: Gyroscope" },
      { id: "DeviceMotion.rotationRate", label: "DeviceMotion: rotationRate" },
    ],
  },
  {
    id: "orientation_quaternion_relative",
    category: "Orientation",
    label: "Orientation (quaternion, relative)",
    android: "TYPE_GAME_ROTATION_VECTOR",
    ios: "CMAttitude (relative changes)",
    strategies: [
      { id: "RelativeOrientationSensor", label: "Generic Sensor: RelativeOrientationSensor" },
      { id: "DeviceOrientationQuaternion.relative", label: "Derived: DeviceOrientationEvent → quaternion (relative)" },
    ],
  },
  {
    id: "geolocation",
    category: "Location",
    label: "Geolocation (GPS/network)",
    android: "Location (GPS/network)",
    ios: "Core Location (CLLocationManager)",
    strategies: [{ id: "Geolocation", label: "Web API: navigator.geolocation" }],
  },
];
