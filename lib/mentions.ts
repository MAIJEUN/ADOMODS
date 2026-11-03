import type { Mod } from "@/lib/mods"

// Uploaders' names by Discord user ID, gathered from the mod lists the page has loaded, so a mention of
// someone who uploaded a mod can show their name. Other mentions can only show the ID.
const names = new Map<string, string>()

export function rememberUploaderNames(mods: Mod[]) {
  for (const mod of mods) if (mod.user && mod.cachedUsername) names.set(mod.user, mod.cachedUsername)
}

export function rememberNames(entries: Record<string, string>) {
  for (const [id, name] of Object.entries(entries)) names.set(id, name)
}

export const getUploaderName = (id: string) => names.get(id)

const USER_MENTION = /<@!?(\d+)>/g

// For pages sent with only a few mods: the names of the uploaders a text mentions
export function getMentionedUploaderNames(text: string | undefined, mods: Mod[]): Record<string, string> {
  const ids = new Set(Array.from(text?.matchAll(USER_MENTION) ?? [], (match) => match[1]))
  const found: Record<string, string> = {}
  for (const mod of mods) {
    if (mod.user && mod.cachedUsername && ids.has(mod.user) && !found[mod.user]) found[mod.user] = mod.cachedUsername
  }
  return found
}
