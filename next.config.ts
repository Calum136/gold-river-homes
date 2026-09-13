import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every photo is a static WebP under public/, already sized and compressed
  // (docs/visualization/03-asset-pipeline.md). Serve the files as they are:
  // no runtime image optimization, so hosting costs nothing per request.
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: "/calculator",
        destination: "/configure",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
