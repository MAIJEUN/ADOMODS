import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import ModPage from "@/components/mod-page"
import { stripDiscordEmoji } from "@/lib/discord-markdown"
import { proxyImage } from "@/lib/image-proxy"
import { findModByKey, getDownloadUrl, getModHref, getModsSafe, type Mod } from "@/lib/mods"
import { siteUrl } from "@/lib/site"
import { getMentionedUploaderNames } from "@/lib/mentions"

type Props = { params: Promise<{ id: string }> }

// Generated on first visit and cached, regenerated at most hourly: there are hundreds of these pages and
// crawlers visit them all, so a short interval adds up fast on Vercel's ISR write and CPU quotas
export const revalidate = 3600
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

async function findMod(key: string) {
  const mods = await getModsSafe()
  return { mods, mod: findModByKey(mods, key) }
}

// Rough plain-text version of a Discord-markdown description for link previews
// (Line-start markers go before emoji: stripDiscordEmoji also collapses the line breaks.)
const toPlainText = (markdown: string) =>
  stripDiscordEmoji(
    markdown
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/^\s*(-#|#{1,3}|>>>|>|[-*]|\d+\.)\s+/gm, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]<[^>]*>\)?/g, "$1")
      .replace(/<(https?:\/\/[^>]+)>/g, "$1")
      .replace(/[*_~`|]/g, ""),
  )
    .replace(/\s+/g, " ")
    .trim()

// Through the image proxy: Discord attachment links expire, so a crawled or embedded link would break
const getModImage = (mod: Mod) => {
  const src = mod.thumbnail || mod.imageURL
  return src ? proxyImage(src) : undefined
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mod } = await findMod(decodeId((await params).id))
  if (!mod) return { title: "모드" }

  const name = stripDiscordEmoji(mod.name) || "모드"
  // "얼불춤 모드" is what people search for, so it goes in the title shown in results
  const title = `${name} - 얼불춤 모드`
  const plain = mod.description ? toPlainText(mod.description) : ""
  const description = [
    `얼불춤(A Dance of Fire and Ice) 모드 ${name}${mod.version ? ` v${mod.version}` : ""} 다운로드`,
    plain.slice(0, 150),
  ]
    .filter(Boolean)
    .join(" · ")
  const image = getModImage(mod)

  // Also the embed when the link is pasted in Discord
  return {
    title,
    description,
    alternates: { canonical: getModHref(mod) },
    // The bot marks some entries as not meant for search
    robots: mod.hideFromSearch ? { index: false } : undefined,
    openGraph: {
      title: name,
      description,
      type: "article",
      siteName: "ADOMODS",
      images: image ? [image] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: name, description },
  }
}

// Lets search engines read the page as a downloadable game mod, with a breadcrumb trail for results
function ModJsonLd({ mod }: { mod: Mod }) {
  const url = `${siteUrl}${getModHref(mod)}`
  const name = stripDiscordEmoji(mod.name)
  const image = getModImage(mod)
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name,
      url,
      applicationCategory: "GameApplication",
      applicationSubCategory: "A Dance of Fire and Ice mod",
      softwareVersion: mod.version,
      datePublished: mod.uploadedTimestamp ? new Date(mod.uploadedTimestamp).toISOString() : undefined,
      description: mod.description ? toPlainText(mod.description).slice(0, 300) : undefined,
      image: image ? new URL(image, siteUrl).toString() : undefined,
      downloadUrl: getDownloadUrl(mod) ?? undefined,
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ADOMODS", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name, item: url },
      ],
    },
  ]
  // "<" escaped so text from the description can't close the script tag
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}

export default async function ModRoute({ params }: Props) {
  const key = decodeId((await params).id)
  const { mods, mod } = await findMod(key)
  // An empty list means the API failed; let the client retry instead of a hard 404
  if (mods.length > 0 && !mod) notFound()
  // Links from before mod pages were addressed by name
  if (mod && mod.name !== key) permanentRedirect(getModHref(mod))
  return (
    <>
      {mod && !mod.hideFromSearch && <ModJsonLd mod={mod} />}
      <ModPage
        modId={key}
        initialMods={mod ? [mod] : undefined}
        // Only this mod is sent with the page; these let its mentions of other uploaders show names
        mentionNames={getMentionedUploaderNames(mod?.description, mods)}
      />
    </>
  )
}
