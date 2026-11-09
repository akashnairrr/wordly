import type { NextConfig } from "next"

// Hosted on Vercel: pages are prerendered, and the translator's server action keeps the DeepL key on the server.
const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
}

export default nextConfig
