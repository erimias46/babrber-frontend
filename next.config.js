/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://your-barber-backend-9364a99fcf71.herokuapp.com/api",
    NEXT_PUBLIC_SOCKET_URL:
      process.env.NEXT_PUBLIC_SOCKET_URL || "https://your-barber-backend-9364a99fcf71.herokuapp.com",
    NEXT_PUBLIC_MAPS_API_KEY: process.env.NEXT_PUBLIC_MAPS_API_KEY || "",
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  },
  images: {
    domains: ["res.cloudinary.com"],
  },
  output: "standalone",
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

module.exports = nextConfig;
