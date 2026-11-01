import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist"],
  // Use standalone output for more efficient deployment (smaller footprint, less memory)
  output: "standalone",
  // Exclude large Books folder from build output - books should be on a volume or cloud storage
  outputFileTracingExcludes: {
    "*": ["./Books/**/*"],
  },
};

export default nextConfig;
