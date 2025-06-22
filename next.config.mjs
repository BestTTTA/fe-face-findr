/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'be-facefindr.thetigerteamacademy.net',
        pathname: '/results/**',
      },
    ],
  },
};

export default nextConfig;
