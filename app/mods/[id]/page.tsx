import type { Metadata } from "next"
import { notFound } from "next/navigation"
import ModPage from "@/components/mod-page"
import { stripDiscordEmoji } from "@/lib/discord-markdown"
import { safeExternalUrl } from "@/lib/image-proxy"
import { getModHref, getModId, getModsSafe } from "@/lib/mods"

type Props = { params: Promise<{ id: string }> }

// Generated on first visit and cached, regenerated at most every 5 minutes
export const revalidate = 300
export function generateStaticParams() {
  return []
}

const decodeId = (id: string) => {
  try {
    return decodeURIComponent(id)
  } catch {
    return id
  }
}

async function findMod(id: string) {
  const mods = await getModsSafe()
  return { mods, mod: mods.find((mod) => getModId(mod) === id) }
}

// Rough plain-text version of a Discord-markdown description for link previews
const toPlainText = (markdown: string) =>
  stripDiscordEmoji(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s*(-#|#{1,3}|>>>|>|[-*]|\d+\.)\s+/gm, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_~`|]/g, "")
    .replace(/\s+/g, " ")
    .trim()

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mod } = await findMod(decodeId((await params).id))
  if (!mod) return { title: "모드" }

  const title = stripDiscordEmoji(mod.name) || "모드"
  const plain = mod.description ? toPlainText(mod.description) : ""
  const description = [mod.cachedUsername && `by ${mod.cachedUsername}`, plain.slice(0, 180)]
    .filter(Boolean)
    .join(" · ")
  const image = safeExternalUrl(mod.thumbnail?.replace(/[&?]+$/, "")) ?? safeExternalUrl(mod.imageURL)

  // Shown as the embed when the link is pasted in Discord
  return {
    title,
    description,
    alternates: { canonical: getModHref(mod) },
    // The bot marks some entries as not meant for search
    robots: mod.hideFromSearch ? { index: false } : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "ADOMODS",
      images: image ? [image] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  }
}

export default async function ModRoute({ params }: Props) {
  const id = decodeId((await params).id)
  const { mods, mod } = await findMod(id)
  // An empty list means the API failed; let the client retry instead of a hard 404
  if (mods.length > 0 && !mod) notFound()
  return <ModPage modId={id} initialMods={mod ? [mod] : undefined} />
}
