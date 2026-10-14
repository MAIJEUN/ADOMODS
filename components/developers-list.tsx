"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search } from "lucide-react"
import { matchesQuery, toChosungKey } from "@/lib/hangul"
import { formatDate, getDevelopers, type Developer, type Mod } from "@/lib/mods"
import { useT } from "@/lib/use-lang"
import { useMods } from "@/components/mod-card"
import { DeveloperAvatar } from "@/components/developer"

type DeveloperSort = "mods" | "recent" | "name"

const SORTERS: Record<DeveloperSort, (a: Developer, b: Developer) => number> = {
  mods: (a, b) => b.modCount - a.modCount || (b.latestUpload || 0) - (a.latestUpload || 0),
  recent: (a, b) => (b.latestUpload || 0) - (a.latestUpload || 0),
  name: (a, b) => a.name.localeCompare(b.name, "ko"),
}

export default function DevelopersList({ initialMods }: { initialMods?: Mod[] }) {
  const { t, locale } = useT()
  const { mods, error, isLoading } = useMods(initialMods)
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<DeveloperSort>("mods")

  const developers = useMemo(() => getDevelopers(mods), [mods])
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return developers
      .filter((dev) => !q || matchesQuery(dev.name.toLowerCase(), toChosungKey(dev.name), q))
      .sort(SORTERS[sortBy])
  }, [developers, query, sortBy])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-2xl font-bold">{t("devs.title")}</h2>
        <Badge variant="secondary" className="px-3 py-1">
          {t("devs.count", { n: shown.length })}
        </Badge>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("devs.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as DeveloperSort)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mods">{t("devs.sortMods")}</SelectItem>
            <SelectItem value="recent">{t("devs.sortRecent")}</SelectItem>
            <SelectItem value="name">{t("devs.sortName")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t("common.error")}</CardTitle>
            <CardDescription>{t("common.loadError")}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((dev) => (
            <Link
              key={dev.id}
              href={`/developers/${encodeURIComponent(dev.id)}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <DeveloperAvatar mod={dev.avatarMod} size="lg" />
              <div className="min-w-0 space-y-1">
                <p className="truncate text-lg font-semibold">{dev.name}</p>
                <p className="text-sm text-muted-foreground">{t("dev.modCount", { n: dev.modCount })}</p>
                {dev.latestUpload && (
                  <p className="text-xs text-muted-foreground">
                    {t("devs.latest", { date: formatDate(dev.latestUpload, locale) })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
