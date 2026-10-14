export const MODS_API_URL = "https://bot.adofai.gg/api/mods/"

export interface Mod {
  _id?: string
  id: string | number
  name: string
  description?: string
  author?: string
  cachedUsername?: string
  version?: string
  downloads?: number
  thumbnail?: string
  download?: string
  downloadUrl?: string
  category?: string
  uploadedTimestamp?: number
  user?: string
  guild?: string
  channel?: string
  message?: string
  cachedAvatar?: string
  imageURL?: string
  [key: string]: any
}

// The API has returned a bare array as well as { mods } / { data }
export const normalizeMods = (data: unknown): Mod[] => {
  if (Array.isArray(data)) return data
  const obj = data as { mods?: Mod[]; data?: Mod[] } | null | undefined
  return obj?.mods || obj?.data || []
}

export const formatDate = (timestamp?: number) => {
  if (!timestamp) return "알 수 없음"
  return new Date(timestamp).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

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
  return normalizeMods(await response.json())
}
