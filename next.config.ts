import type { NextConfig } from "next";


const isDev = process.argv.includes("dev");

if (!process.env.VELITE_STARTED && isDev) {
  process.env.VELITE_STARTED = "1";
  import("velite").then(({ build }) => build({ watch: true, clean: false }));
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
