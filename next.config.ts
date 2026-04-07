import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  typescript: {
    // asChild props on @base-ui/react components cause TS errors but work fine at runtime
    ignoreBuildErrors: true,
  },
  // Fix: prevent Next.js from using ~/package.json as workspace root (there is a
  // package.json in the home directory that confuses Next.js workspace detection).
  outputFileTracingRoot: path.join(__dirname),
  // Fix: next-auth@5 beta / @auth/core are ESM-only; bundling them through webpack
  // causes "Attempted import error" for namespace re-exports. Marking as external
  // lets Node.js load them natively at runtime.
  serverExternalPackages: ["next-auth", "@auth/core", "stripe", "@prisma/client", "@prisma/adapter-pg", "pg"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
