import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Next.js defaults server action request bodies to 1MB, which
      // rejects most photo/video test files before our own 20MB
      // prototype upload cap (see MAX_UPLOAD_BYTES in src/lib/dropbox.ts)
      // ever gets a chance to run.
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
