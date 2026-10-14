"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, ExternalLink, Loader2, Package } from "lucide-react"
import { formatDate, getModId, isModOfDeveloper, type Mod } from "@/lib/mods"
import { useT } from "@/lib/use-lang"
import { ModCard, useMods } from "@/components/mod-card"
import { useModDialog } from "@/components/mod-detail"
import { DeveloperAvatar } from "@/components/developer"

export default function DeveloperProfile({ developerId, initialMods }: { developerId: string; initialMods?: Mod[] }) {
  const { t, locale } = useT()
  const { mods, error, isLoading } = useMods(initialMods)
  const { openMod, dialog } = useModDialog(mods)

  const developerMods = useMemo(
    () =>
      mods
        .filter((mod: Mod) => mod.version && isModOfDeveloper(mod, developerId))
        .sort((a, b) => (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0)),
    [mods, developerId],
  )

  // Newest entry has the most recent cached name/avatar
  const latest = developerMods[0]
  const name = latest?.cachedUsername || developerId
  const avatarMod = developerMods.find((mod) => mod.cachedAvatar) ?? latest
  const firstUpload = developerMods[developerMods.length - 1]?.uploadedTimestamp
  const discordProfileUrl = latest?.user && /^\d+$/.test(latest.user) ? `https://discord.com/users/${latest.user}` : null

  return (
    <div className="space-y-8">
      {/* scroll={false}: the list restores its own scroll position */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/" scroll={false}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.allMods")}
        </Link>
      </Button>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t("common.error")}</CardTitle>
            <CardDescription>
              {t("common.loadError")}
              <br />
              <span className="text-xs font-mono mt-2 block">{error.message}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && developerMods.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dev.notFound")}</CardTitle>
            <CardDescription>{t("dev.notFoundHint")}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && developerMods.length > 0 && (
        <>
          <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {avatarMod && <DeveloperAvatar mod={avatarMod} size="lg" />}
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-3xl font-bold break-words">{name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  {t("dev.modCount", { n: developerMods.length })}
                </span>
                {firstUpload && latest?.uploadedTimestamp && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {firstUpload === latest.uploadedTimestamp
                      ? formatDate(firstUpload, locale)
                      : `${formatDate(firstUpload, locale)} ~ ${formatDate(latest.uploadedTimestamp, locale)}`}
                  </span>
                )}
              </div>
            </div>
            {discordProfileUrl && (
              <Button variant="outline" asChild>
                <a href={discordProfileUrl} target="_blank" rel="noopener noreferrer">
                  {t("dev.discordProfile")}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">{t("dev.mods")}</h3>
              <Badge variant="secondary">{developerMods.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {developerMods.map((mod, index) => (
                <ModCard key={getModId(mod) || index} mod={mod} onOpen={openMod} showDeveloper={false} />
              ))}
            </div>
          </section>
        </>
      )}

      {dialog}
    </div>
  )
}
