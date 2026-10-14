"use client"

import { useState, useMemo, useEffect, useLayoutEffect, useCallback, useRef } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { safeExternalUrl } from "@/lib/image-proxy"
import { stripDiscordEmoji } from "@/lib/discord-markdown"
import { useFavorites } from "@/lib/favorites"
import { matchesQuery, toChosungKey } from "@/lib/hangul"
import { countActiveFilters, ModFilters, SORT_TYPES, type FilterState, type SortType } from "@/components/mod-filters"
import {
  getDeveloperId,
  getDevelopers,
  getModHref,
  getModId,
  isUploadedWithin,
  NEW_MOD_DAYS,
  RECENT_MOD_DAYS,
  type Mod,
} from "@/lib/mods"
import { useT } from "@/lib/use-lang"
import { isPlainClick, ModCard, useMods } from "@/components/mod-card"
import { useModDialog } from "@/components/mod-detail"
import { DeveloperAvatar } from "@/components/developer"
import { DiscordText } from "@/components/mod-markdown"
import { HorizontalScroller } from "@/components/horizontal-scroller"

// "10/14" style date for the compact recent row
const formatShortDate = (timestamp: number | undefined, locale: string) =>
  timestamp ? new Date(timestamp).toLocaleDateString(locale, { month: "numeric", day: "numeric" }) : ""

// Leading emoji like <:name:id> shouldn't decide the alphabetical order
const sortName = (mod: Mod) => stripDiscordEmoji(mod.name || "")

// Cards are rendered in pages as the user scrolls; rendering hundreds of markdown cards at once is slow
const PAGE_SIZE = 24
// Above-the-fold cards whose thumbnails load eagerly
const EAGER_CARDS = 6
const RECENT_LIMIT = 8

// List state kept across client-side navigations, so coming back from a developer page
// restores the search, filters, loaded cards and scroll position
const savedState = {
  searchQuery: "",
  sortBy: "newest" as SortType,
  filters: {} as FilterState,
  visibleCount: PAGE_SIZE,
  scrollY: 0,
}

// ?q=...&sort=...&dev=<id>&dev=<id>&dl=1&fav=1&new=1 — shareable and survives reloads
const parseQuery = (search: string) => {
  const params = new URLSearchParams(search)
  const sort = params.get("sort")
  const developers = params.getAll("dev").filter(Boolean)
  return {
    searchQuery: params.get("q") ?? "",
    sortBy: SORT_TYPES.includes(sort as SortType) ? (sort as SortType) : "newest",
    filters: {
      developers: developers.length > 0 ? developers : undefined,
      hasDownload: params.get("dl") === "1" || undefined,
      favoritesOnly: params.get("fav") === "1" || undefined,
      newOnly: params.get("new") === "1" || undefined,
    } satisfies FilterState,
  }
}

const buildQuery = (searchQuery: string, sortBy: SortType, filters: FilterState) => {
  const params = new URLSearchParams()
  if (searchQuery.trim()) params.set("q", searchQuery.trim())
  if (sortBy !== "newest") params.set("sort", sortBy)
  for (const id of filters.developers ?? []) params.append("dev", id)
  if (filters.hasDownload) params.set("dl", "1")
  if (filters.favoritesOnly) params.set("fav", "1")
  if (filters.newOnly) params.set("new", "1")
  const query = params.toString()
  return query ? `?${query}` : ""
}

function LoadMoreSentinel({ onLoadMore }: { onLoadMore: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Re-created whenever onLoadMore changes (after each page), so it fires again if still in view
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && onLoadMore(), {
      rootMargin: "1200px 0px",
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [onLoadMore])

  return <div ref={ref} aria-hidden className="h-px" />
}

function RecentMods({ mods, onOpen }: { mods: Mod[]; onOpen: (mod: Mod) => void }) {
  const { t, locale } = useT()
  if (mods.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="h-4 w-4 text-primary" />
        {t("list.recent")}
      </h2>
      <HorizontalScroller className="gap-2">
        {mods.map((mod) => (
          <a
            key={getModId(mod)}
            href={getModHref(mod)}
            onClick={(e) => {
              if (!isPlainClick(e)) return
              e.preventDefault()
              onOpen(mod)
            }}
            className="flex w-52 shrink-0 snap-start flex-col gap-1 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-primary/50"
          >
            <span className="truncate text-sm font-semibold">
              <DiscordText text={mod.name} />
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DeveloperAvatar mod={mod} />
              <span className="truncate">{mod.cachedUsername}</span>
              <span className="ml-auto shrink-0">{formatShortDate(mod.uploadedTimestamp, locale)}</span>
            </span>
          </a>
        ))}
      </HorizontalScroller>
    </section>
  )
}

export default function ModsList({ initialMods }: { initialMods?: Mod[] }) {
  const { t } = useT()
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery)
  const [debouncedSearch, setDebouncedSearch] = useState(savedState.searchQuery)
  const [sortBy, setSortBy] = useState<SortType>(savedState.sortBy)
  const [filters, setFilters] = useState<FilterState>(savedState.filters)
  // Becomes true once the URL query has been read, so the URL isn't overwritten before that
  const [urlReady, setUrlReady] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // A query in the URL wins over the remembered state (shared links, reloads)
  useEffect(() => {
    if (window.location.search) {
      const fromUrl = parseQuery(window.location.search)
      setSearchQuery(fromUrl.searchQuery)
      setDebouncedSearch(fromUrl.searchQuery)
      setSortBy(fromUrl.sortBy)
      setFilters(fromUrl.filters)
    }
    setUrlReady(true)
  }, [])

  // Mirror the list state into the URL (replace, so typing doesn't add history entries)
  useEffect(() => {
    if (!urlReady || window.location.pathname !== "/") return
    const query = buildQuery(debouncedSearch, sortBy, filters)
    if (query !== window.location.search) window.history.replaceState(null, "", `/${query}`)
  }, [urlReady, debouncedSearch, sortBy, filters])

  // "/" focuses the search box
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target.closest("input, textarea, select, [contenteditable=true]")) return
      e.preventDefault()
      searchInputRef.current?.focus()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const { mods: modsArray, error, isLoading } = useMods(initialMods)
  const { openMod, dialog } = useModDialog(modsArray)
  const { favorites } = useFavorites()

  // Lowercased search text (and initial consonants for ㅋㅂㅇ-style queries) per mod,
  // built once per data load instead of on every keystroke
  const searchIndex = useMemo(
    () =>
      new Map(
        modsArray.map((mod) => [
          mod,
          {
            text: [mod.name, mod.description, mod.author, mod.cachedUsername].filter(Boolean).join("\n").toLowerCase(),
            chosung: toChosungKey(`${sortName(mod)} ${mod.cachedUsername ?? ""}`),
          },
        ]),
      ),
    [modsArray],
  )

  const developers = useMemo(
    () => getDevelopers(modsArray).sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [modsArray],
  )

  const filteredAndSortedMods = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return modsArray
      .filter((mod: Mod) => {
        if (!mod.version) return false
        if (filters.developers?.length && !filters.developers.includes(getDeveloperId(mod) ?? "")) return false
        if (filters.hasDownload && !safeExternalUrl(mod.download)) return false
        if (filters.favoritesOnly && !favorites.has(getModId(mod))) return false
        if (filters.newOnly && !isUploadedWithin(mod, NEW_MOD_DAYS)) return false
        if (!query) return true
        const entry = searchIndex.get(mod)
        return !!entry && matchesQuery(entry.text, entry.chosung, query)
      })
      .sort((a: Mod, b: Mod) => {
        switch (sortBy) {
          case "newest":
            return (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0)
          case "oldest":
            return (a.uploadedTimestamp || 0) - (b.uploadedTimestamp || 0)
          case "name-asc":
            return sortName(a).localeCompare(sortName(b), "ko")
          case "name-desc":
            return sortName(b).localeCompare(sortName(a), "ko")
          default:
            return 0
        }
      })
  }, [modsArray, searchIndex, filters, favorites, debouncedSearch, sortBy])

  const activeFilterCount = countActiveFilters(filters)
  const isFiltering = activeFilterCount > 0 || debouncedSearch.trim() !== ""

  // Shown above the list only when browsing without a search or filters
  const recentMods = useMemo(
    () =>
      modsArray
        .filter((mod) => mod.version && isUploadedWithin(mod, RECENT_MOD_DAYS))
        .sort((a, b) => (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0))
        .slice(0, RECENT_LIMIT),
    [modsArray],
  )

  // Changing the search, sort or filters starts again from the first page
  const listKey = JSON.stringify([debouncedSearch, sortBy, filters])
  const [visible, setVisible] = useState({ key: listKey, count: savedState.visibleCount })
  const visibleCount = visible.key === listKey ? visible.count : PAGE_SIZE
  const visibleMods = filteredAndSortedMods.slice(0, visibleCount)
  const loadMore = useCallback(
    () => setVisible({ key: listKey, count: visibleCount + PAGE_SIZE }),
    [listKey, visibleCount],
  )

  useEffect(() => {
    Object.assign(savedState, { searchQuery, sortBy, filters, visibleCount })
  }, [searchQuery, sortBy, filters, visibleCount])

  // Restore the scroll position from the last visit; save it when leaving
  useLayoutEffect(() => {
    if (savedState.scrollY) window.scrollTo(0, savedState.scrollY)
    return () => {
      savedState.scrollY = window.scrollY
    }
  }, [])

  return (
    <div className="space-y-6">
      <ModFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filters={filters}
        onFiltersChange={setFilters}
        developers={developers}
        resultCount={filteredAndSortedMods.length}
        favoritesCount={favorites.size}
      />

      {!isFiltering && !isLoading && !error && <RecentMods mods={recentMods} onOpen={openMod} />}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
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

      {/* Mods Grid */}
      {!isLoading && !error && (
        <>
          {filteredAndSortedMods.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{modsArray.length === 0 ? t("list.noData") : t("list.noResults")}</CardTitle>
                <CardDescription>
                  {modsArray.length === 0
                    ? t("list.noDataHint")
                    : filters.favoritesOnly && favorites.size === 0
                      ? t("list.noFavorites")
                      : t("list.tryOther")}
                </CardDescription>
                {isFiltering && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilters({})
                        setSearchQuery("")
                        setDebouncedSearch("")
                      }}
                    >
                      {t("list.resetFilters")}
                    </Button>
                  </div>
                )}
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleMods.map((mod: Mod, index: number) => (
                <ModCard key={getModId(mod) || index} mod={mod} onOpen={openMod} eager={index < EAGER_CARDS} />
              ))}
            </div>
          )}
        </>
      )}

      {visibleCount < filteredAndSortedMods.length && <LoadMoreSentinel onLoadMore={loadMore} />}

      {dialog}
    </div>
  )
}
