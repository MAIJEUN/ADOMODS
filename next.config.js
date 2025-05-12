/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "cdn.discordapp.com",
      "media.discordapp.net",
      "images-ext-1.discordapp.net",
      "images-ext-2.discordapp.net",
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig
