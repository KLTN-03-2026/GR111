import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  // Output standalone build for Docker/Render deployment
  output: "standalone",
};

export default nextConfig;
