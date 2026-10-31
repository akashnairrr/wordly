import type { NextConfig } from "next"

// Static export: the app is plain files (HTML/JS + public/data JSON), hostable on GitHub Pages.
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
}

export default nextConfig
