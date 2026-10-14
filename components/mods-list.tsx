"use client"

import { useState, useMemo, useEffect, useLayoutEffect, useCallback, useRef, type ReactNode } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Loader2, Filter, X, Sparkles } from "lucide-react"
import { safeExternalUrl, proxyImage } from "@/lib/image-proxy"
import { stripDiscordEmoji } from "@/lib/discord-markdown"
import { useFavorites } from "@/lib/favorites"
import { matchesQuery, toChosungKey } from "@/lib/hangul"
import {
  formatDate,
  getDeveloperId,
  getDevelopers,
  getModHref,
  getModId,
  isUploadedWithin,
  RECENT_MOD_DAYS,
  type Mod,
} from "@/lib/mods"
import { useT } from "@/lib/use-lang"
import { isPlainClick, ModCard, useMods } from "@/components/mod-card"
import { useModDialog } from "@/components/mod-detail"
import { DeveloperAvatar } from "@/components/developer"
import { DiscordText } from "@/components/mod-markdown"

// Leading emoji like <:name:id> shouldn't decide the alphabetical order
const sortName = (mod: Mod) => stripDiscordEmoji(mod.name || "")

const SORT_TYPES = ["newest", "oldest", "name-asc", "name-desc"] as const
type SortType = (typeof SORT_TYPES)[number]

interface FilterState {
  // Developer IDs (see getDeveloperId)
  developers?: string[]
  hasDownload?: boolean
  favoritesOnly?: boolean
}

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

// ?q=...&sort=...&dev=<id>&dev=<id>&dl=1&fav=1 — shareable and survives reloads
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
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {mods.map((mod) => (
          <a
            key={getModId(mod)}
            href={getModHref(mod)}
            onClick={(e) => {
              if (!isPlainClick(e)) return
              e.preventDefault()
              onOpen(mod)
            }}
            className="group flex w-56 shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50"
          >
            <div className="aspect-video w-full overflow-hidden bg-muted">
              {mod.thumbnail ? (
                <img
                  src={proxyImage(mod.thumbnail)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground/60">
                  {sortName(mod).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="line-clamp-1 text-sm font-semibold">
                <DiscordText text={mod.name} />
              </p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DeveloperAvatar mod={mod} />
                <span className="truncate">{mod.cachedUsername}</span>
                <span className="ml-auto shrink-0">{formatDate(mod.uploadedTimestamp, locale)}</span>
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

function FilterChip({ label, onRemove, removeLabel }: { label: ReactNode; onRemove: () => void; removeLabel: string }) {
  return (
    <Badge variant="secondary" className="gap-1">
      {label}
      <button type="button" aria-label={removeLabel} onClick={onRemove} className="ml-1 hover:bg-muted rounded-full">
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )
}

export default function ModsList({ initialMods }: { initialMods?: Mod[] }) {
  const { t } = useT()
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery)
  const [debouncedSearch, setDebouncedSearch] = useState(savedState.searchQuery)
  const [sortBy, setSortBy] = useState<SortType>(savedState.sortBy)
  const [filters, setFilters] = useState<FilterState>(savedState.filters)
  const [developerSearch, setDeveloperSearch] = useState("")
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
  const developerNames = useMemo(() => new Map(developers.map((dev) => [dev.id, dev.name])), [developers])

  const filteredDevelopers = useMemo(() => {
    const query = developerSearch.trim().toLowerCase()
    if (!query) return developers
    return developers.filter((dev) => matchesQuery(dev.name.toLowerCase(), toChosungKey(dev.name), query))
  }, [developers, developerSearch])

  const filteredAndSortedMods = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return modsArray
      .filter((mod: Mod) => {
        if (!mod.version) return false
        if (filters.developers?.length && !filters.developers.includes(getDeveloperId(mod) ?? "")) return false
        if (filters.hasDownload && !safeExternalUrl(mod.download)) return false
        if (filters.favoritesOnly && !favorites.has(getModId(mod))) return false
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

  const activeFilterCount = [filters.developers?.length, filters.hasDownload, filters.favoritesOnly].filter(
    Boolean,
  ).length
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

  const toggleDeveloper = (developer: string) => {
    setFilters((prev) => {
      const current = prev.developers || []
      if (current.includes(developer)) {
        const updated = current.filter((d) => d !== developer)
        return { ...prev, developers: updated.length > 0 ? updated : undefined }
      } else {
        return { ...prev, developers: [...current, developer] }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Search Bar and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder={t("list.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                {t("list.filter")}
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t("list.filter")}</h4>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
                      {t("list.clearAll")}
                    </Button>
                  )}
                </div>

                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={!!filters.favoritesOnly}
                    onCheckedChange={(checked) =>
                      setFilters((prev) => ({ ...prev, favoritesOnly: checked === true || undefined }))
                    }
                  />
                  {t("list.favoritesOnly")}
                </label>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("list.developer")} {filters.developers?.length ? `(${filters.developers.length})` : ""}
                  </label>
                  <Input
                    type="text"
                    placeholder={t("list.developerSearch")}
                    value={developerSearch}
                    onChange={(e) => setDeveloperSearch(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-2">
                    {filteredDevelopers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">{t("list.noResults")}</p>
                    ) : (
                      filteredDevelopers.map((dev) => (
                        <div key={dev.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dev-${dev.id}`}
                            checked={filters.developers?.includes(dev.id) || false}
                            onCheckedChange={() => toggleDeveloper(dev.id)}
                          />
                          <label
                            htmlFor={`dev-${dev.id}`}
                            className="flex flex-1 cursor-pointer items-center gap-2 text-sm font-normal leading-none"
                          >
                            <DeveloperAvatar mod={dev.avatarMod} />
                            <span className="truncate">{dev.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{dev.modCount}</span>
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("list.availability")}</label>
                  <Select
                    value={filters.hasDownload ? "yes" : "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        hasDownload: value === "yes" ? true : undefined,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("list.showAll")}</SelectItem>
                      <SelectItem value="yes">{t("list.downloadableOnly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("list.sort")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("sort.newest")}</SelectItem>
              <SelectItem value="oldest">{t("sort.oldest")}</SelectItem>
              <SelectItem value="name-asc">{t("sort.nameAsc")}</SelectItem>
              <SelectItem value="name-desc">{t("sort.nameDesc")}</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="px-3 py-1">
            {t("list.count", { n: filteredAndSortedMods.length })}
          </Badge>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{t("list.activeFilters")}</span>
          {filters.favoritesOnly && (
            <FilterChip
              label={t("list.favorites")}
              removeLabel={t("list.removeFilter")}
              onRemove={() => setFilters((prev) => ({ ...prev, favoritesOnly: undefined }))}
            />
          )}
          {filters.developers && filters.developers.length > 0 && (
            <FilterChip
              label={t("list.developerFilter", {
                names: filters.developers.map((id) => developerNames.get(id) ?? id).join(", "),
              })}
              removeLabel={t("list.removeFilter")}
              onRemove={() => setFilters((prev) => ({ ...prev, developers: undefined }))}
            />
          )}
          {filters.hasDownload && (
            <FilterChip
              label={t("list.downloadable")}
              removeLabel={t("list.removeFilter")}
              onRemove={() => setFilters((prev) => ({ ...prev, hasDownload: undefined }))}
            />
          )}
        </div>
      )}

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
