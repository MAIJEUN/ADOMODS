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

// The mod's source repository: from the download links, else the first repo linked in the description
export function getSourceRepoUrl(mod: Mod): string | null {
  // parsedDownload first: it follows renamed repositories (OrbitRender was ADOFAIRenderer)
  const candidates = [mod.parsedDownload ?? "", mod.download ?? "", ...(mod.description?.match(REPO_LINK) ?? [])]
  for (const candidate of candidates) {
    const repo = toRepoUrl(candidate)
    if (repo && !LOADER_REPOS.has(repo.replace("https://", "").toLowerCase())) return repo
  }
  return null
}
