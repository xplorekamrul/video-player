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

   experimental: {
    allowedDevOrigins: ['192.168.68.129'], 
  },
};

export default nextConfig;
