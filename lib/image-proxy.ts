// Hosts whose images are served through /api/proxy-image.
// The proxy route only fetches from these hosts, so it can't be used as an open proxy.
export const PROXY_IMAGE_HOSTS = ["cdn.discordapp.com", "media.discordapp.net", "cdn.discord.com"]

const parseHttpUrl = (url?: string) => {
  if (!url) return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed : null
  } catch {
    return null
  }
}

// Returns the URL only when it is an absolute http(s) URL; blocks javascript:, data:, etc.
export const safeExternalUrl = (url?: string) => parseHttpUrl(url)?.toString() ?? null

export const isProxyableImageUrl = (url: URL) =>
  url.protocol === "https:" && PROXY_IMAGE_HOSTS.includes(url.hostname)

export const proxyImage = (url?: string) => {
  // Discord attachment URLs sometimes come with a dangling & or ?
  const parsed = parseHttpUrl(url?.replace(/[&?]+$/, ""))
  if (!parsed) return "/placeholder.svg"
  if (isProxyableImageUrl(parsed)) {
    return `/api/proxy-image?url=${encodeURIComponent(parsed.toString())}`
  }
  return parsed.toString()
}
