"use client"

import Link from "next/link"
import { BackButton } from "@/components/back-button"
import { DiscordText } from "@/components/mod-markdown"
import { formatDate } from "@/lib/mods"
import { useT } from "@/lib/use-lang"

export interface ModIndexEntry {
  name: string
  href: string
  uploader?: string
  version?: string
  uploadedTimestamp?: number
}

// /mods: every listed mod by name, as plain links. Lets people scan the whole list at once, and gives
// search engines a crawlable path to every mod page (the home page only renders the first few).
export default function ModIndex({ entries }: { entries: ModIndexEntry[] }) {
  const { t, locale } = useT()

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/" fallbackLabel="common.allMods" />
      <div>
        <h1 className="text-2xl font-bold">{t("index.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("index.subtitle", { n: entries.length })}</p>
      </div>
      <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <li key={entry.href} className="border-b border-border py-2.5">
            <Link href={entry.href} className="font-medium break-words hover:text-primary hover:underline">
              <DiscordText text={entry.name} />
            </Link>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {[entry.uploader, entry.version && `v${entry.version}`, entry.uploadedTimestamp && formatDate(entry.uploadedTimestamp, locale)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
