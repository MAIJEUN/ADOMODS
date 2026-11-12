import { type NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { getModsSafe } from "@/lib/mods"

// GET /api/avatar/<Discord user ID> — redirects to the user's current Discord avatar. The avatar hash in
// the mod data is from when the mod was posted, so it breaks once the user changes their avatar; this
// asks Discord for the current one (needs DISCORD_BOT_TOKEN). Used when the stored avatar fails to load.

const notFound = () =>
  new NextResponse("Avatar not found", { status: 404, headers: { "Cache-Control": "public, s-maxage=3600" } })

// The avatar hash, or null for a user with no custom avatar. Asked at most once a day per user.
const getAvatarHash = (id: string) =>
  unstable_cache(
    async (): Promise<{ avatar: string | null }> => {
      const response = await fetch(`https://discord.com/api/v10/users/${id}`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
        signal: AbortSignal.timeout(10_000),
      })
      // Not cached as "no avatar": a rate limit or outage shouldn't stick for a day
      if (!response.ok) throw new Error(`Discord users API returned ${response.status}`)
      const user = (await response.json()) as { avatar?: string | null }
      return { avatar: user.avatar ?? null }
    },
    ["discord-avatar", id],
    { revalidate: 86400 },
  )()

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d{15,21}$/.test(id) || !process.env.DISCORD_BOT_TOKEN) return notFound()
  // Only people who uploaded a mod, so this can't be used to look up arbitrary Discord users
  if (!(await getModsSafe()).some((mod) => mod.user === id)) return notFound()

  try {
    const { avatar } = await getAvatarHash(id)
    const url = avatar
      ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.${avatar.startsWith("a_") ? "gif" : "png"}?size=128`
      : // Discord's default avatar for accounts without one
        `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(id) >> BigInt(22)) % BigInt(6))}.png`
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "public, s-maxage=86400" } })
  } catch (error) {
    console.error("Avatar lookup error:", error)
    return new NextResponse("Avatar lookup failed", { status: 502, headers: { "Cache-Control": "no-store" } })
  }
}
