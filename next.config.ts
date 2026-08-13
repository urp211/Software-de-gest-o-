import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Keep native/shim modules external so Next doesn't bundle them incorrectly
  serverExternalPackages: ["better-sqlite3", "drizzle-orm"],
};

export default nextConfig;
