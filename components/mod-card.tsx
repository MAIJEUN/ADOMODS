"use client"

import { memo, useMemo, type MouseEvent } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Hash, Info, Star } from "lucide-react"
import { proxyImage } from "@/lib/image-proxy"
import { stripDiscordEmoji } from "@/lib/discord-markdown"
import { useFavorites } from "@/lib/favorites"
import {
  formatDate,
  getDownloadUrl,
  getModHref,
  getModId,
  isUploadedWithin,
  NEW_MOD_DAYS,
  normalizeMods,
  type Mod,
} from "@/lib/mods"
import { useT } from "@/lib/use-lang"
import { DownloadButton } from "@/components/download-button"
import { DeveloperAvatar, DeveloperLink } from "@/components/developer"
import { DescriptionPreview, DiscordText } from "@/components/mod-markdown"
import { useImageFallback } from "@/components/use-image-fallback"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch mods")
  return res.json()
}

// `initialMods` comes from the server render; when present the client doesn't refetch on mount
export function useMods(initialMods?: Mod[]) {
  const hasInitial = !!initialMods && initialMods.length > 0
  const { data, error, isLoading } = useSWR("/api/mods", fetcher, {
    revalidateOnFocus: false,
    fallbackData: hasInitial ? initialMods : undefined,
    revalidateOnMount: !hasInitial,
  })
  // Memoized so the fallback [] doesn't create a new array (and re-run every memo downstream) on each render
  const mods = useMemo(() => normalizeMods(data), [data])
  return { mods, error: error as Error | undefined, isLoading }
}

export function FavoriteButton({ mod, className, showLabel }: { mod: Mod; className?: string; showLabel?: boolean }) {
  const { t } = useT()
  const { isFavorite, toggleFavorite } = useFavorites()
  const id = getModId(mod)
  const active = isFavorite(id)
  const label = active ? t("card.unfavorite") : t("card.favorite")

  const star = <Star className={active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />

  if (showLabel) {
    return (
      <Button variant="outline" aria-pressed={active} className={className} onClick={() => toggleFavorite(id)}>
        {star}
        {t("list.favorites")}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={className}
      onClick={() => toggleFavorite(id)}
    >
      {star}
    </Button>
  )
}

// Plain left clicks open the dialog in place; modified clicks (new tab etc.) follow the real link
export const isPlainClick = (e: MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

// Memoized: opening the detail dialog or typing in search must not re-parse every card's markdown
export const ModCard = memo(function ModCard({
  mod,
  onOpen,
  showDeveloper = true,
  eager = false,
}: {
  mod: Mod
  onOpen: (mod: Mod) => void
  showDeveloper?: boolean
  // Above-the-fold cards load their thumbnail immediately
  eager?: boolean
}) {
  const { t, locale } = useT()
  const isNew = isUploadedWithin(mod, NEW_MOD_DAYS)
  // Expired/deleted thumbnails are dropped instead of showing a broken image
  const thumbnail = useImageFallback()

  // The whole card opens the details, except its own links and buttons
  const handleCardClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest("a, button, [role=button]")) return
    onOpen(mod)
  }

  // content-visibility lets the browser skip style/layout for off-screen cards (opening a dialog restyles the page)
  return (
    <Card
      onClick={handleCardClick}
      className="group cursor-pointer hover:border-primary/50 transition-all duration-200 overflow-hidden flex flex-col [content-visibility:auto] [contain-intrinsic-size:auto_420px]"
    >
      {mod.thumbnail && !thumbnail.failed && (
        <div className="aspect-video w-full bg-muted relative overflow-hidden">
          <img
            src={proxyImage(mod.thumbnail)}
            alt={stripDiscordEmoji(mod.name)}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            decoding="async"
            ref={thumbnail.ref}
            onError={thumbnail.onError}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">
            <a
              href={getModHref(mod)}
              className="hover:text-primary"
              onClick={(e) => {
                if (!isPlainClick(e)) return
                e.preventDefault()
                onOpen(mod)
              }}
            >
              <DiscordText text={mod.name} />
            </a>
          </CardTitle>
          <div className="-mt-1.5 -mr-2 flex shrink-0 items-center gap-1">
            {isNew && <Badge>{t("card.new")}</Badge>}
            {mod.category && <Badge variant="outline">{mod.category}</Badge>}
            <FavoriteButton mod={mod} className="h-8 w-8" />
          </div>
        </div>
        {mod.description && (
          <CardDescription className="line-clamp-2">
            <DescriptionPreview description={mod.description} />
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex-1 space-y-2 text-sm">
          {showDeveloper && mod.cachedUsername && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DeveloperAvatar mod={mod} />
              <DeveloperLink mod={mod} className="text-foreground font-medium truncate" />
            </div>
          )}
          {mod.version && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span>{t("card.version", { v: mod.version })}</span>
            </div>
          )}
          {mod.uploadedTimestamp && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(mod.uploadedTimestamp, locale)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <DownloadButton url={getDownloadUrl(mod) ?? undefined} className="flex-1" />

          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpen(mod)}>
            <Info className="mr-2 h-4 w-4" />
            {t("card.details")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
