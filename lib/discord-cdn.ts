// Discord attachment URLs (cdn.discordapp.com/attachments/...) are signed: ex= is the expiry as a hex
// unix timestamp, and after ~24h the CDN answers 404. The mod data stores the URL from when the mod was
// posted, so most stored image links are expired. Discord can re-sign them via
// POST /attachments/refresh-urls, which needs a bot token (DISCORD_BOT_TOKEN).

const ATTACHMENT_HOSTS = new Set(["cdn.discordapp.com", "media.discordapp.net"])
const REFRESH_ENDPOINT = "https://discord.com/api/v10/attachments/refresh-urls"
// Refresh a bit early so a URL doesn't expire between refreshing and fetching
const EXPIRY_MARGIN_MS = 60_000

export const isDiscordAttachmentUrl = (url: URL) =>
  ATTACHMENT_HOSTS.has(url.hostname) && /^\/(ephemeral-)?attachments\//.test(url.pathname)

// True when the signature is missing or past its expiry
export function isDiscordUrlExpired(url: URL, now = Date.now()) {
  const ex = url.searchParams.get("ex")
  if (!ex || !/^[0-9a-f]+$/i.test(ex)) return true
  return parseInt(ex, 16) * 1000 - EXPIRY_MARGIN_MS < now
}

export const canRefreshDiscordUrls = () => !!process.env.DISCORD_BOT_TOKEN

// Refreshed URLs, reused until they expire (per server instance)
const refreshed = new Map<string, URL>()

export async function refreshDiscordUrl(url: URL): Promise<URL | null> {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) return null

  const key = `${url.origin}${url.pathname}`
  const cached = refreshed.get(key)
  if (cached && !isDiscordUrlExpired(cached)) return cached

  const response = await fetch(REFRESH_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ attachment_urls: [url.toString()] }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    console.error("Discord refresh-urls failed:", response.status, await response.text().catch(() => ""))
    return null
  }

  const data = (await response.json()) as { refreshed_urls?: { original: string; refreshed: string }[] }
  const fresh = data.refreshed_urls?.[0]?.refreshed
  if (!fresh) return null

  const freshUrl = new URL(fresh)
  // Only ever follow a refresh back to Discord's own CDN
  if (!isDiscordAttachmentUrl(freshUrl)) return null
  refreshed.set(key, freshUrl)
  return freshUrl
}
