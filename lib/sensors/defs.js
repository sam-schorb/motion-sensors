export const SENSOR_DEFS = [
  {
    id: "acceleration_including_gravity",
    category: "Motion",
    label: "Acceleration (including gravity)",
    android: "TYPE_ACCELEROMETER",
    ios: "CMAccelerometerData / CMDeviceMotion",
    strategies: [
      { id: "Accelerometer", label: "Generic Sensor: Accelerometer" },
      { id: "DeviceMotion.accelerationIncludingGravity", label: "DeviceMotion: accelerationIncludingGravity" },
    ],
  },
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
    id: "rotation_vector_quaternion",
    category: "Orientation",
    label: "Rotation vector (quaternion)",
    android: "TYPE_ROTATION_VECTOR",
    ios: "CMDeviceMotion.attitude (quaternion)",
    strategies: [
      { id: "AbsoluteOrientationSensor", label: "Generic Sensor: AbsoluteOrientationSensor" },
      { id: "DeviceOrientationQuaternion.absolute", label: "Derived: DeviceOrientationEvent → quaternion" },
    ],
  },
  {
    id: "geomagnetic_rotation_vector_quaternion",
    category: "Orientation",
    label: "Geomagnetic rotation vector (quaternion)",
    android: "TYPE_GEOMAGNETIC_ROTATION_VECTOR",
    ios: "CMDeviceMotion.attitude (quaternion)",
    strategies: [
      { id: "AbsoluteOrientationSensor", label: "Generic Sensor: AbsoluteOrientationSensor" },
      { id: "DeviceOrientationQuaternion.absolute", label: "Derived: DeviceOrientationEvent → quaternion" },
    ],
  },
  {
    id: "orientation_euler",
    category: "Orientation",
    label: "Orientation (alpha/beta/gamma)",
    android: "TYPE_ORIENTATION (deprecated)",
    ios: "CMAttitude (roll/pitch/yaw)",
    strategies: [{ id: "DeviceOrientation", label: "DeviceOrientationEvent" }],
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

