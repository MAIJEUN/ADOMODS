/** @type {import('next').NextConfig} */
const nextConfig = {
  // The translate button only shows when the server can translate; inlined into the client at build time
  env: {
    NEXT_PUBLIC_TRANSLATION_ENABLED: process.env.ANTHROPIC_API_KEY ? "1" : "",
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig