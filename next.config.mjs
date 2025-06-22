/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '119.59.99.192',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'facefindr.api.thetigerteamacademy.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'be-facefindr.thetigerteamacademy.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
