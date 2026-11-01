import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  // Use standalone output for more efficient deployment (smaller footprint, less memory)
  output: "standalone",
};

export default nextConfig;
