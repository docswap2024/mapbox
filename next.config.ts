import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'sr-webimages-002.s3.us-west-2.amazonaws.com',
      'sr-webimages-002.s3.amazonaws.com',
      'maps.googleapis.com',
      'cdnparap130.paragonrels.com'
    ],
},
};

export default nextConfig;
