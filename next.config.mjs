/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.tkma.co.jp",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "stat.ameba.jp",
      },
      {
        protocol: "https",
        hostname: "*.ameba.jp",
      },
    ],
  },
};

export default nextConfig;
