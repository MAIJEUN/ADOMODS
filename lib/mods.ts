import { safeExternalUrl } from "@/lib/image-proxy"

// Overridable for local testing against a mock API
export const MODS_API_URL = process.env.MODS_API_URL || "https://bot.adofai.gg/api/mods/"

export interface Mod {
  _id?: string
  id: string | number
  name: string
  description?: string
  author?: string
  cachedUsername?: string
  version?: string
  thumbnail?: string
  download?: string
  category?: string
  uploadedTimestamp?: number
  user?: string
  guild?: string
  channel?: string
  message?: string
  cachedAvatar?: string
  imageURL?: string
  // Direct file link the bot resolved from `download` (e.g. a GitHub release asset)
  parsedDownload?: string
  // Set by the bot for entries that shouldn't show up in searches
  hideFromSearch?: boolean
  // Every published version of this mod, including the current one
  versions?: ModVersion[]
}

export interface ModVersion {
  version: string
  uploadedTimestamp?: number
}

// Only the fields the UI uses; keeps the API response and the server-rendered page payload small
const MOD_FIELDS = [
  "_id",
  "id",
  "name",
  "description",
  "author",
  "cachedUsername",
  "version",
  "thumbnail",
  "download",
  "category",
  "uploadedTimestamp",
  "user",
  "guild",
  "channel",
  "message",
  "cachedAvatar",
  "imageURL",
  "parsedDownload",
  "hideFromSearch",
  "versions",
] as const satisfies readonly (keyof Mod)[]

// Korean particles that start a line where the bot cut the mod name out of the sentence
// ("OrbitRender는 레벨을…" arrives as "는 레벨을…"). 이/가/에/도 are left out: lines legitimately
// start with them ("이 모드는…").
const STRIPPED_NAME_LINE = /^((?:\s*(?:>|[-*]|#{1,3}|-#)\s+)*)(는|은|을|를|의|와|과|에서|으로|로)(?=\s)/m

// The bot removes the first occurrence of the mod's name from its description; put it back
export const restoreStrippedName = (description: string, name: string) =>
  name ? description.replace(STRIPPED_NAME_LINE, (_, prefix: string, particle: string) => `${prefix}${name}${particle}`) : description

const slimMod = (mod: Mod): Mod => {
  const slim: Record<string, unknown> = {}
  for (const key of MOD_FIELDS) {
    if (mod[key] !== undefined && mod[key] !== null) slim[key] = mod[key]
  }
  if (typeof slim.description === "string" && typeof slim.name === "string") {
    slim.description = restoreStrippedName(slim.description, slim.name)
  }
  return slim as unknown as Mod
}

// The API has returned a bare array as well as { mods } / { data }
export const normalizeMods = (data: unknown): Mod[] => {
  if (Array.isArray(data)) return data
  const obj = data as { mods?: Mod[]; data?: Mod[] } | null | undefined
  return obj?.mods || obj?.data || []
}

export const formatDate = (timestamp?: number, locale = "ko-KR") => {
  if (!timestamp) return locale.startsWith("ko") ? "알 수 없음" : locale.startsWith("zh") ? "未知" : "Unknown"
  return new Date(timestamp).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Mods shown in lists (mod list, recent row, developer pages and counts): only entries with a
// version and a usable download link. Others are incomplete bot entries.
export const isListedMod = (mod: Mod) => !!mod.version && !!getDownloadUrl(mod) && !mod.hideFromSearch

// The bot's resolved file link when there is one, otherwise the link the author posted
export const getDownloadUrl = (mod: Mod) => safeExternalUrl(mod.parsedDownload) ?? safeExternalUrl(mod.download)

// Versions newest first; falls back to the current version for entries without a history
export function getModVersions(mod: Mod): ModVersion[] {
  const versions = mod.versions?.filter((v) => v?.version) ?? []
  if (mod.version && !versions.some((v) => v.version === mod.version)) {
    versions.push({ version: mod.version, uploadedTimestamp: mod.uploadedTimestamp })
  }
  return [...versions].sort((a, b) => (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0))
}

// Stable identifier used in /mods/[id] URLs and for favorites
export const getModId = (mod: Mod) => String(mod._id ?? mod.id)
export const getModHref = (mod: Mod) => `/mods/${encodeURIComponent(getModId(mod))}`

const DAY_MS = 24 * 60 * 60 * 1000
export const NEW_MOD_DAYS = 7
export const RECENT_MOD_DAYS = 14
export const isUploadedWithin = (mod: Mod, days: number, now = Date.now()) =>
  !!mod.uploadedTimestamp && now - mod.uploadedTimestamp < days * DAY_MS

export const getDiscordMessageUrl = (mod: Mod) => {
  if (mod.guild && mod.channel && mod.message) {
    return `https://discord.com/channels/${mod.guild}/${mod.channel}/${mod.message}`
  }
  return null
}

// Discord user ID is stable across username changes; fall back to the name for older entries
export const getDeveloperId = (mod: Mod) => mod.user || mod.cachedUsername || null

export const getDeveloperHref = (mod: Mod) => {
  const id = getDeveloperId(mod)
  return id ? `/developers/${encodeURIComponent(id)}` : null
}

export const isModOfDeveloper = (mod: Mod, developerId: string) =>
  mod.user === developerId || (!mod.user && mod.cachedUsername === developerId)

export interface Developer {
  id: string
  name: string
  // Newest mod that has an avatar (or the newest mod), for DeveloperAvatar
  avatarMod: Mod
  modCount: number
  latestUpload?: number
}

// Groups mods by developer; name/avatar come from the developer's newest mod
export function getDevelopers(mods: Mod[]): Developer[] {
  const byId = new Map<string, Mod[]>()
  for (const mod of mods) {
    const id = getDeveloperId(mod)
    if (!id || !isListedMod(mod)) continue
    const list = byId.get(id)
    if (list) list.push(mod)
    else byId.set(id, [mod])
  }
  return [...byId].map(([id, devMods]) => {
    const sorted = devMods.sort((a, b) => (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0))
    return {
      id,
      name: sorted.find((mod) => mod.cachedUsername)?.cachedUsername || id,
      avatarMod: sorted.find((mod) => mod.cachedAvatar) ?? sorted[0],
      modCount: sorted.length,
      latestUpload: sorted[0].uploadedTimestamp,
    }
  })
}

export const getAvatarUrl = (mod: Mod) => {
  const avatar = mod.cachedAvatar
  if (!avatar) return null
  if (/^https?:\/\//.test(avatar)) return avatar
  // Bare avatar hash
  if (mod.user) return `https://cdn.discordapp.com/avatars/${mod.user}/${avatar}.${avatar.startsWith("a_") ? "gif" : "png"}?size=128`
  return null
}

// Server-side fetch shared by the API route and server components
export async function fetchModsFromUpstream(): Promise<Mod[]> {
  const response = await fetch(MODS_API_URL, {
    headers: { Accept: "application/json" },
    // Cache upstream response for 5 minutes instead of hitting the bot API on every visit
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`)
  }
  return normalizeMods(await response.json()).map(slimMod)
}

// One mod: GET {MODS_API_URL}{name} (latest, with its version history) or {MODS_API_URL}{name}/{version}
export async function fetchModVersionFromUpstream(name: string, version?: string): Promise<Mod | null> {
  const path = version ? `${encodeURIComponent(name)}/${encodeURIComponent(version)}` : encodeURIComponent(name)
  const response = await fetch(`${MODS_API_URL}${path}`, {
    headers: { Accept: "application/json" },
    // Published versions don't change; the latest entry does
    next: { revalidate: version ? 86400 : 300 },
    signal: AbortSignal.timeout(10_000),
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`API returned ${response.status}`)
  const data = await response.json()
  const entry = (Array.isArray(data) ? data[0] : (data?.mod ?? data)) as Mod | undefined
  return entry && typeof entry === "object" ? slimMod(entry) : null
}

// For server-rendered pages: never fail the render, the client refetches if this comes back empty
export async function getModsSafe(): Promise<Mod[]> {
  try {
    return await fetchModsFromUpstream()
  } catch (error) {
    console.error("Mods fetch error:", error)
    return []
  }
}
