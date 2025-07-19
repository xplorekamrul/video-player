/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Add allowed origins for development
  allowedDevOrigins: [
    'http://localhost:3000',    // Localhost
    'http://192.168.68.74:3000' // তোমার local network IP
  ],
};

export default nextConfig;
