import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
