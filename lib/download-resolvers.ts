import { driveDownloadUrl, parseDriveId, parseGithubRepo, type DownloadFile, type ResolvedDownload } from "@/lib/download"

const TIMEOUT_MS = 10_000

interface GithubRelease {
  name?: string | null
  tag_name: string
  html_url: string
  published_at?: string | null
  prerelease?: boolean
  assets: { name: string; size: number; browser_download_url: string }[]
}

async function githubApi<T>(path: string): Promise<T | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "adomods",
  }
  // Unauthenticated requests are limited to 60/hour per IP; a token raises that to 5000
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const response = await fetch(`https://api.github.com${path}`, {
    headers,
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`)
  return response.json()
}

export function githubReleaseToDownload(release: GithubRelease, sourceUrl: string): ResolvedDownload {
  const title = [release.name || release.tag_name, release.name && release.name !== release.tag_name && release.tag_name]
    .filter(Boolean)
    .join(" · ")
  const files = release.assets.map((asset) => ({
    name: asset.name,
    url: asset.browser_download_url,
    size: asset.size,
  }))
  return {
    files,
    title,
    prerelease: !!release.prerelease,
    sourceUrl: release.html_url || sourceUrl,
    note: files.length === 0 ? "noAssets" : undefined,
  }
}

async function resolveGithub(url: URL): Promise<ResolvedDownload | null> {
  const repo = parseGithubRepo(url)
  if (!repo) return null
  const base = `/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`

  // /releases/latest skips prereleases; fall back to the newest release of any kind
  const release =
    (await githubApi<GithubRelease>(`${base}/releases/latest`)) ??
    (await githubApi<GithubRelease[]>(`${base}/releases?per_page=1`))?.[0]

  if (!release) {
    return { files: [], sourceUrl: url.toString(), note: "noReleases" }
  }
  return githubReleaseToDownload(release, url.toString())
}

// embeddedfolderview is Drive's public, script-free folder listing
export function parseDriveFolderHtml(html: string): DownloadFile[] {
  const files: DownloadFile[] = []
  const entry = /<a href="https:\/\/drive\.google\.com\/file\/d\/([\w-]+)[^"]*"[^>]*>[\s\S]*?<div class="flip-entry-title">([\s\S]*?)<\/div>/g
  for (const [, id, rawName] of html.matchAll(entry)) {
    files.push({ name: decodeHtml(rawName.trim()), url: driveDownloadUrl(id) })
  }
  return files
}

async function resolveDriveFolder(url: URL): Promise<ResolvedDownload | null> {
  const drive = parseDriveId(url)
  if (drive?.type !== "folder") return null
  const response = await fetch(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(drive.id)}`, {
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Drive returned ${response.status}`)
  const files = parseDriveFolderHtml(await response.text())
  return {
    files,
    sourceUrl: url.toString(),
    note: files.length === 0 ? "emptyFolder" : undefined,
  }
}

export function parseMediafireHtml(html: string): string | null {
  const button = /<a[^>]*id="downloadButton"[^>]*>/.exec(html)?.[0] ?? ""
  // Newer pages put the link base64-encoded in data-scrambled-url
  const scrambled = /data-scrambled-url="([^"]+)"/.exec(button)?.[1]
  const href = scrambled ? Buffer.from(scrambled, "base64").toString("utf8") : /href="([^"]+)"/.exec(button)?.[1]
  return href && /^https:\/\/download\d*\.mediafire\.com\//.test(href) ? decodeHtml(href) : null
}

async function resolveMediafire(url: URL): Promise<ResolvedDownload | null> {
  if (url.hostname.replace(/^www\./, "") !== "mediafire.com") return null
  const response = await fetch(`https://www.mediafire.com${url.pathname}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    // Direct links can be short-lived
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`MediaFire returned ${response.status}`)
  const direct = parseMediafireHtml(await response.text())
  if (!direct) return { files: [], sourceUrl: url.toString(), note: "noLink" }
  const name = decodeURIComponent(new URL(direct).pathname.split("/").pop() || "download")
  return { files: [{ name, url: direct }], sourceUrl: url.toString() }
}

const decodeHtml = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")

export async function resolveDownload(url: URL): Promise<ResolvedDownload | null> {
  return (await resolveGithub(url)) ?? (await resolveDriveFolder(url)) ?? (await resolveMediafire(url))
}
