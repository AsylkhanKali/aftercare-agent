import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // agent-core is a workspace package shipped as TypeScript source.
  transpilePackages: ["agent-core"],
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
};

export default nextConfig;
