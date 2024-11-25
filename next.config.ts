import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pdf-parse"],
  output: 'export',
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
