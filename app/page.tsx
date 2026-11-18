import type { Metadata } from "next"
import ModsList from "@/components/mods-list"
import { getModsSafe } from "@/lib/mods"
import { siteUrl } from "@/lib/site"

// Rendered with data on the server and regenerated at most hourly, like the mod data it shows (lib/mods.ts)
export const revalidate = 3600

export const metadata: Metadata = { alternates: { canonical: "/" } }

// Tells Google the site's name for search results
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ADOMODS",
  alternateName: ["얼불춤 모드", "ADOFAI Mods"],
  url: `${siteUrl}/`,
  inLanguage: "ko",
}

export default async function Home() {
  const mods = await getModsSafe()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <ModsList initialMods={mods} />
    </>
  )
}
