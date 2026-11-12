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
  if (!timestamp) {
    const unknown: Record<string, string> = { ko: "알 수 없음", zh: "未知", ja: "不明", fr: "Inconnu" }
    return unknown[locale.slice(0, 2)] ?? "Unknown"
  }
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

// Identifier used for favorites
export const getModId = (mod: Mod) => String(mod._id ?? mod.id)

// Mod pages are addressed by name: the bot keys mods by name, it doesn't change with new versions, and
// it reads well in search results
export const getModHref = (mod: Mod) => `/mods/${encodeURIComponent(mod.name)}`

// The mod a /mods/[key] URL points to: by name, or by the ID older links used. A listed entry wins over a
// hidden one with the same name.
export const findModByKey = (mods: Mod[], key: string) =>
  mods.find((mod) => mod.name === key && isListedMod(mod)) ??
  mods.find((mod) => mod.name === key) ??
  mods.find((mod) => getModId(mod) === key)

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

// Developer pages are addressed by Discord handle (/developers/tjwogud), which reads better and shows up in
// search results. Handles can change, so the page also answers to the user ID and to old handles still on
// older mods, and redirects those to the current handle (app/developers/[id]/page.tsx).
export const developerPath = (key: string) => `/developers/${encodeURIComponent(key)}`

export const getDeveloperHref = (mod: Mod) => {
  const key = mod.cachedUsername || getDeveloperId(mod)
  return key ? developerPath(key) : null
}

// The developer a /developers/[key] URL points to (by user ID, current or old handle), and the address
// their page should be at: the current handle, or the ID when there's no handle or another developer
// has the same one
export function resolveDeveloper(mods: Mod[], key: string): { id: string; path: string } | null {
  let id: string | null = mods.some((mod) => mod.user === key) ? key : null
  if (!id) {
    const lower = key.toLowerCase()
    const owners = new Set(mods.filter((mod) => mod.cachedUsername?.toLowerCase() === lower).map(getDeveloperId))
    if (owners.size === 1) id = [...owners][0]
  }
  if (!id) return null
  const developerId = id

  const own = mods
    .filter((mod) => isModOfDeveloper(mod, developerId))
    .sort((a, b) => (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0))
  const handle = own.find((mod) => mod.cachedUsername)?.cachedUsername
  const handleTaken = !!handle && getDevelopers(mods).some((dev) => dev.id !== developerId && dev.name === handle)
  return { id: developerId, path: developerPath(handle && !handleTaken ? handle : developerId) }
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
  // Their page: by current handle, or by ID when there's none or it's not unique
  href: string
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
  const developers = [...byId].map(([id, devMods]) => {
    const sorted = devMods.sort((a, b) => (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0))
    return {
      id,
      name: sorted.find((mod) => mod.cachedUsername)?.cachedUsername || id,
      avatarMod: sorted.find((mod) => mod.cachedAvatar) ?? sorted[0],
      modCount: sorted.length,
      latestUpload: sorted[0].uploadedTimestamp,
      href: "",
    }
  })
  const nameCount = new Map<string, number>()
  for (const dev of developers) nameCount.set(dev.name, (nameCount.get(dev.name) ?? 0) + 1)
  for (const dev of developers) dev.href = developerPath(nameCount.get(dev.name) === 1 ? dev.name : dev.id)
  return developers
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
    // Cache the upstream response for an hour. Pages using it can't regenerate more often than this, and
    // each regeneration counts against Vercel's ISR write and CPU quotas; new mods show up within the hour.
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) {
    throw new Error(`API returned ${response.status}`)
  }
  return normalizeMods(await response.json()).map(slimMod)
}

// One mod: GET {MODS_API_URL}{name}/ (latest, with its version history) or {MODS_API_URL}{name}/{version}
export async function fetchModVersionFromUpstream(name: string, version?: string): Promise<Mod | null> {
  // Same shapes as the bot serves them: mods/{name}/ (with history) and mods/{name}/{version}
  const path = version ? `${encodeURIComponent(name)}/${encodeURIComponent(version)}` : `${encodeURIComponent(name)}/`
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
