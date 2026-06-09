import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Required for the production Docker stage — outputs a minimal standalone
  // server bundle that doesn't need node_modules at runtime.
  // Has no effect in dev (docker-compose uses the `dev` build stage instead).
  output: "standalone",
}

export default nextConfig
