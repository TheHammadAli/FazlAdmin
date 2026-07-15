import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "market-knayf-app-bucket.s3.us-east-1.amazonaws.com",
        pathname: "**",
      },
    ],
  },
};

export default nextConfig;
