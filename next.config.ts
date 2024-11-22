import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sr-webimages-002.s3.us-west-2.amazonaws.com',
      },
    ],
},
};

export default nextConfig;
