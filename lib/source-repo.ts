import { parseGithubRepo } from "@/lib/download"
import { safeExternalUrl } from "@/lib/image-proxy"
import type { Mod } from "@/lib/mods"

// Mod loaders that descriptions link to as requirements; never the mod's own source
const LOADER_REPOS = new Set([
  "github.com/lavagang/melonloader",
  "github.com/newman55/unity-mod-manager",
  "github.com/bepinex/bepinex",
])

const OTHER_HOSTS = new Set(["gitlab.com", "codeberg.org"])

// Normalizes any link inside a repository (releases, tags, files, ...) to the repository itself
function toRepoUrl(raw: string): string | null {
  const safe = safeExternalUrl(raw)
  if (!safe) return null
  const url = new URL(safe)

  const github = parseGithubRepo(url)
  if (github) return `https://github.com/${github.owner}/${github.repo}`

  const host = url.hostname.replace(/^www\./, "")
  if (OTHER_HOSTS.has(host)) {
    // GitLab project paths end where its "/-/" routes (releases, tree, ...) begin
    const [owner, repo] = url.pathname.split("/-/")[0].split("/").filter(Boolean)
    if (owner && repo) return `https://${host}/${owner}/${repo.replace(/\.git$/, "")}`
  }
  return null
}

const REPO_LINK = /https?:\/\/(?:www\.)?(?:github\.com|gitlab\.com|codeberg\.org)\/[^\s()<>[\]"'`|*]+/gi

export interface SourceRepo {
  url: string
  // owner/repo, for showing in a list
  name: string
  host: string
  // Where the mod's download link points, so most likely the mod's own repository
  fromDownload: boolean
}

// Every source repository a mod links to, most likely first: the download links' repository, then the ones
// the description links to, in order. Descriptions often link several (dependencies, related mods), so the
// first one isn't always the mod's own.
export function getSourceRepos(mod: Mod): SourceRepo[] {
  // parsedDownload first: it follows renamed repositories (OrbitRender was ADOFAIRenderer)
  const candidates = [
    ...[mod.parsedDownload, mod.download].map((link) => ({ link: link ?? "", fromDownload: true })),
    ...(mod.description?.match(REPO_LINK) ?? []).map((link) => ({ link, fromDownload: false })),
  ]
  const repos: SourceRepo[] = []
  const seen = new Set<string>()
  for (const { link, fromDownload } of candidates) {
    const url = toRepoUrl(link)
    if (!url) continue
    // GitHub and GitLab paths aren't case-sensitive
    const key = url.replace("https://", "").toLowerCase()
    if (LOADER_REPOS.has(key) || seen.has(key)) continue
    seen.add(key)
    const { host, pathname } = new URL(url)
    repos.push({ url, name: pathname.slice(1), host, fromDownload })
  }
  return repos
}
