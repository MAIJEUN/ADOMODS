import type { Metadata } from "next"
import ModIndex from "@/components/mod-index"
import { stripDiscordEmoji } from "@/lib/discord-markdown"
import { getModHref, getModsSafe, isListedMod } from "@/lib/mods"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "전체 모드 목록",
  description: "ADOMODS에 올라온 얼불춤(A Dance of Fire and Ice) 모드 전체를 이름순으로 모아 봅니다.",
  alternates: { canonical: "/mods" },
}

export default async function ModsIndexPage() {
  const mods = (await getModsSafe()).filter(isListedMod)
  // Only what the list shows, so the page stays light
  const entries = mods
    .map((mod) => ({
      name: mod.name,
      href: getModHref(mod),
      uploader: mod.cachedUsername,
      version: mod.version,
      uploadedTimestamp: mod.uploadedTimestamp,
    }))
    .sort((a, b) => stripDiscordEmoji(a.name).localeCompare(stripDiscordEmoji(b.name), "ko", { sensitivity: "base", numeric: true }))
  return <ModIndex entries={entries} />
}
