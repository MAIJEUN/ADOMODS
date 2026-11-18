"use client"

import { memo, useMemo, type MouseEvent } from "react"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { proxyImage } from "@/lib/image-proxy"
import { stripDiscordEmoji } from "@/lib/discord-markdown"
import { useFavorites } from "@/lib/favorites"
import { rememberUploaderNames } from "@/lib/mentions"
import {
  formatDate,
  formatShortDate,
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
  const mods = useMemo(() => {
    const list = normalizeMods(data)
    // Lets mentions of these uploaders in descriptions show their names
    rememberUploaderNames(list)
    return list
  }, [data])
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

  const version = mod.version && (/^\d/.test(mod.version) ? `v${mod.version}` : mod.version)

  // content-visibility lets the browser skip style/layout for off-screen cards (opening a dialog restyles the page)
  return (
    <div
      data-slot="card"
      onClick={handleCardClick}
      className="group flex cursor-pointer flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/40 sm:p-5 [content-visibility:auto] [contain-intrinsic-size:auto_170px]"
    >
      {mod.thumbnail && !thumbnail.failed && (
        <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={proxyImage(mod.thumbnail)}
            alt={stripDiscordEmoji(mod.name)}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            decoding="async"
            ref={thumbnail.ref}
            onError={thumbnail.onError}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex min-w-0 items-center gap-2">
        <h3 className="min-w-0 truncate text-base font-semibold">
          <a
            href={getModHref(mod)}
            className="hover:underline underline-offset-4"
            onClick={(e) => {
              if (!isPlainClick(e)) return
              e.preventDefault()
              onOpen(mod)
            }}
          >
            <DiscordText text={mod.name} />
          </a>
        </h3>
        {isNew && (
          <Badge variant="outline" className="shrink-0 rounded-full px-2 text-[11px]">
            {t("card.new")}
          </Badge>
        )}
        {mod.category && (
          <Badge variant="outline" className="shrink-0">
            {mod.category}
          </Badge>
        )}
        <FavoriteButton mod={mod} className="-my-1 -mr-2 ml-auto h-8 w-8 shrink-0" />
      </div>

      {/* The clamp sits in its own box: stretched by flex-1, it would let a third line show */}
      <div className="min-h-10 flex-1">
        <div data-slot="card-description" className="line-clamp-2 text-sm text-muted-foreground">
          {mod.description && <DescriptionPreview description={mod.description} />}
        </div>
      </div>

      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
        {showDeveloper && mod.cachedUsername && (
          <>
            <DeveloperAvatar mod={mod} />
            <DeveloperLink mod={mod} className="min-w-0 truncate text-foreground" />
          </>
        )}
        {version && (
          <>
            {showDeveloper && mod.cachedUsername && <span aria-hidden className="opacity-50">·</span>}
            <span className="shrink-0" title={t("card.version", { v: mod.version ?? "" })}>
              {version}
            </span>
          </>
        )}
        {mod.uploadedTimestamp && (
          <>
            {(version || (showDeveloper && mod.cachedUsername)) && <span aria-hidden className="opacity-50">·</span>}
            <time
              className="shrink-0"
              dateTime={new Date(mod.uploadedTimestamp).toISOString()}
              title={formatDate(mod.uploadedTimestamp, locale)}
            >
              {formatShortDate(mod.uploadedTimestamp, locale)}
            </time>
          </>
        )}
        <DownloadButton url={getDownloadUrl(mod) ?? undefined} iconOnly className="ml-auto shrink-0" />
      </div>
    </div>
  )
})
