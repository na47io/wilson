import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  output: 'export',
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
