import { safeExternalUrl } from "@/lib/image-proxy"

export interface DownloadFile {
  name: string
  url: string
  size?: number
}

// Codes rather than text so the client can show them in the user's language
export type DownloadNote = "failed" | "noAssets" | "noReleases" | "emptyFolder" | "noLink"

export interface ResolvedDownload {
  files: DownloadFile[]
  // e.g. release name/tag, shown above the file list
  title?: string
  prerelease?: boolean
  // Original page, offered when nothing (or not the right thing) could be resolved
  sourceUrl: string
  note?: DownloadNote
}

export type DownloadPlan =
  // Downloads directly; no new tab needed
  | { kind: "file"; url: string }
  // Unknown page; opened in a new tab as before
  | { kind: "page"; url: string }
  // Needs a server lookup (GitHub release, Drive folder, MediaFire page)
  | { kind: "resolve"; url: string }

const FILE_EXTENSIONS = /\.(zip|rar|7z|tar|gz|dll|unitypackage|exe|jar|adofai|mp3|ogg|wav)$/i

// First path segments on github.com that aren't user/org names
const GITHUB_RESERVED = new Set([
  "settings",
  "orgs",
  "topics",
  "marketplace",
  "sponsors",
  "features",
  "apps",
  "search",
  "explore",
  "notifications",
  "login",
  "about",
  "collections",
  "trending",
])

export const parseGithubRepo = (url: URL) => {
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null
  const [owner, rawRepo, ...rest] = url.pathname.split("/").filter(Boolean)
  if (!owner || !rawRepo || GITHUB_RESERVED.has(owner.toLowerCase())) return null
  return { owner, repo: rawRepo.replace(/\.git$/, ""), rest }
}

export const parseDriveId = (url: URL) => {
  if (url.hostname !== "drive.google.com" && url.hostname !== "docs.google.com") return null
  const folder = /\/folders\/([\w-]+)/.exec(url.pathname)
  if (folder) return { type: "folder" as const, id: folder[1] }
  const file = /\/file\/d\/([\w-]+)/.exec(url.pathname)
  const id = file?.[1] ?? url.searchParams.get("id")
  return id ? { type: "file" as const, id } : null
}

export const driveDownloadUrl = (id: string) =>
  // confirm=t skips the "can't scan for viruses" page shown for large files
  `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`

export function getDownloadPlan(raw?: string): DownloadPlan | null {
  const safe = safeExternalUrl(raw)
  if (!safe) return null
  const url = new URL(safe)
  const host = url.hostname.replace(/^www\./, "")

  const github = parseGithubRepo(url)
  if (github) {
    const path = github.rest.join("/")
    // Release assets (incl. releases/latest/download/...) and source archives are already files
    if (/^releases\/(latest\/)?download\//.test(path) || path.startsWith("archive/")) {
      return { kind: "file", url: safe }
    }
    // A file in the repo: /blob/ shows a page, /raw/ downloads it
    if (path.startsWith("blob/")) {
      url.pathname = url.pathname.replace("/blob/", "/raw/")
      return { kind: "file", url: url.toString() }
    }
    // Repo page, releases list, a release tag, a branch, ... -> latest release
    return { kind: "resolve", url: safe }
  }

  const drive = parseDriveId(url)
  if (drive?.type === "file") return { kind: "file", url: driveDownloadUrl(drive.id) }
  if (drive?.type === "folder") return { kind: "resolve", url: safe }

  if (host === "dropbox.com") {
    // dl=1 downloads instead of showing the preview page (folders come as a zip)
    url.searchParams.set("dl", "1")
    return { kind: "file", url: url.toString() }
  }

  if (host === "mediafire.com" && /^\/(file|file_premium)\//.test(url.pathname)) {
    return { kind: "resolve", url: safe }
  }

  if (
    host === "cdn.discordapp.com" ||
    host === "media.discordapp.net" ||
    host === "drive.usercontent.google.com" ||
    host === "raw.githubusercontent.com" ||
    FILE_EXTENSIONS.test(url.pathname)
  ) {
    return { kind: "file", url: safe }
  }

  return { kind: "page", url: safe }
}

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return null
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}
