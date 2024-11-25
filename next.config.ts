import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pdf-parse"],
  output: 'standalone',
  async redirects() {
    return [
      {
        source: "/",
        destination: "/clause-extraction",
        permanent: true
      }
    ]
  }
};

export default nextConfig;
