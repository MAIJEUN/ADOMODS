import type { MetadataRoute } from "next"
import { getDeveloperHref, getDevelopers, getModHref, getModsSafe, isListedMod } from "@/lib/mods"
import { siteUrl } from "@/lib/site"

export const revalidate = 3600

// Every listed mod and developer page, so search engines find pages that are otherwise only reached
// through client-side links
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const mods = (await getModsSafe()).filter(isListedMod)
  const latest = Math.max(0, ...mods.map((mod) => mod.uploadedTimestamp || 0))
  const lastModified = (timestamp?: number) => (timestamp ? new Date(timestamp) : undefined)

  return [
    { url: `${siteUrl}/`, lastModified: lastModified(latest), changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/developers`, lastModified: lastModified(latest), changeFrequency: "weekly", priority: 0.5 },
    ...mods.map((mod) => ({
      url: `${siteUrl}${getModHref(mod)}`,
      lastModified: lastModified(mod.uploadedTimestamp),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...getDevelopers(mods).map((developer) => ({
      url: `${siteUrl}${getDeveloperHref(developer.avatarMod)}`,
      lastModified: lastModified(developer.latestUpload),
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
  ]
}
