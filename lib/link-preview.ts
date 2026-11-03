import { isDiscordAttachmentUrl } from "@/lib/discord-cdn"
import { safeExternalUrl } from "@/lib/image-proxy"

export type LinkPreview =
  | { kind: "image" | "video"; url: string }
  | { kind: "file"; url: string; fileName: string; host: string }

const IMAGE = /\.(png|jpe?g|gif|webp|avif|bmp)$/i
const VIDEO = /\.(mp4|webm)$/i
// Mod files and archives people link to directly
const FILE = /\.(zip|rar|7z|tar|gz|tgz|dll|exe|unitypackage|adofai)$/i

// What a link points straight at, judged by the file name in its path
export function getLinkPreview(href: string | undefined): LinkPreview | null {
  const safe = safeExternalUrl(href)
  if (!safe) return null
  const url = new URL(safe)
  const last = url.pathname.split("/").pop() ?? ""
  let fileName = last
  try {
    fileName = decodeURIComponent(last)
  } catch {
    // Malformed escape; keep it as written
  }
  if (IMAGE.test(fileName)) return { kind: "image", url: safe }
  if (VIDEO.test(fileName)) return { kind: "video", url: safe }
  if (FILE.test(fileName)) return { kind: "file", url: safe, fileName, host: url.hostname.replace(/^www\./, "") }
  return null
}

// Discord attachment links expire after about a day; these go through a redirect that re-signs them
export function openableHref(href: string) {
  const safe = safeExternalUrl(href)
  if (!safe || !isDiscordAttachmentUrl(new URL(safe))) return href
  return `/api/discord-link?url=${encodeURIComponent(safe)}`
}
