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
        protocol: 'https',
        hostname: 'facefindr.api.thetigerteamacademy.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
