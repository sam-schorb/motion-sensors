/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(self), gyroscope=(self), magnetometer=(self), geolocation=(self), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
