"use client"

import { useState, useMemo, useEffect, useLayoutEffect, useCallback, useRef } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Loader2, Filter, X } from "lucide-react"
import { safeExternalUrl } from "@/lib/image-proxy"
import type { Mod } from "@/lib/mods"
import { ModCard, useModDialog, useMods } from "@/components/mod-card"
import { stripDiscordEmoji } from "@/lib/discord-markdown"

// Leading emoji like <:name:id> shouldn't decide the alphabetical order
const sortName = (mod: Mod) => stripDiscordEmoji(mod.name || "")

type SortType = "newest" | "oldest" | "name-asc" | "name-desc"

interface FilterState {
  developers?: string[]
  hasDownload?: boolean
}

// Cards are rendered in pages as the user scrolls; rendering hundreds of markdown cards at once is slow
const PAGE_SIZE = 24
// Above-the-fold cards whose thumbnails load eagerly
const EAGER_CARDS = 6

// List state kept across client-side navigations, so coming back from a developer page
// restores the search, filters, loaded cards and scroll position
const savedState = {
  searchQuery: "",
  sortBy: "newest" as SortType,
  filters: {} as FilterState,
  visibleCount: PAGE_SIZE,
  scrollY: 0,
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

export default function ModsList({ initialMods }: { initialMods?: Mod[] }) {
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery)
  const [debouncedSearch, setDebouncedSearch] = useState(savedState.searchQuery)
  const [sortBy, setSortBy] = useState<SortType>(savedState.sortBy)
  const [filters, setFilters] = useState<FilterState>(savedState.filters)
  const [developerSearch, setDeveloperSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { mods: modsArray, error, isLoading } = useMods(initialMods)
  const { openMod, dialog } = useModDialog()

  // Lowercased search text per mod, built once per data load instead of on every keystroke
  const searchIndex = useMemo(
    () =>
      new Map(
        modsArray.map((mod) => [
          mod,
          [mod.name, mod.description, mod.author, mod.cachedUsername].filter(Boolean).join("\n").toLowerCase(),
        ]),
      ),
    [modsArray],
  )

  const uniqueDevelopers = useMemo(() => {
    const developers = new Set<string>()
    for (const mod of modsArray) {
      if (mod.version && mod.cachedUsername) developers.add(mod.cachedUsername)
    }
    return [...developers].sort((a, b) => a.localeCompare(b, "ko"))
  }, [modsArray])

  const filteredDevelopers = useMemo(() => {
    if (!developerSearch) return uniqueDevelopers
    const query = developerSearch.toLowerCase()
    return uniqueDevelopers.filter((dev: string) => dev.toLowerCase().includes(query))
  }, [uniqueDevelopers, developerSearch])

  const filteredAndSortedMods = useMemo(() => {
    return modsArray
      .filter((mod: Mod) => mod.version)
      .filter((mod: Mod) => {
        if (filters.developers && filters.developers.length > 0) {
          if (!filters.developers.includes(mod.cachedUsername || "")) {
            return false
          }
        }
        if (filters.hasDownload && !safeExternalUrl(mod.download)) {
          return false
        }
        return true
      })
      .filter((mod: Mod) => {
        const query = debouncedSearch.trim().toLowerCase()
        if (!query) return true
        return searchIndex.get(mod)?.includes(query)
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
  }, [modsArray, searchIndex, filters, debouncedSearch, sortBy])

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

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
  ).length

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
            type="text"
            placeholder="모드 검색..."
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
                필터
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
                  <h4 className="font-medium">필터</h4>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
                      모두 지우기
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    개발자 {filters.developers && filters.developers.length > 0 && `(${filters.developers.length})`}
                  </label>
                  <Input
                    type="text"
                    placeholder="개발자 검색..."
                    value={developerSearch}
                    onChange={(e) => setDeveloperSearch(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-2">
                    {filteredDevelopers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">검색 결과가 없습니다</p>
                    ) : (
                      filteredDevelopers.map((dev: string) => (
                        <div key={dev} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dev-${dev}`}
                            checked={filters.developers?.includes(dev) || false}
                            onCheckedChange={() => toggleDeveloper(dev)}
                          />
                          <label
                            htmlFor={`dev-${dev}`}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {dev}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">다운로드 가능 여부</label>
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
                      <SelectItem value="all">모두 표시</SelectItem>
                      <SelectItem value="yes">다운로드 가능한 모드만</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">최신순</SelectItem>
              <SelectItem value="oldest">오래된순</SelectItem>
              <SelectItem value="name-asc">이름순 (가-하)</SelectItem>
              <SelectItem value="name-desc">이름순 (하-가)</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="px-3 py-1">
            {filteredAndSortedMods.length} 모드
          </Badge>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">활성 필터:</span>
          {filters.developers && filters.developers.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              개발자: {filters.developers.join(", ")}
              <button
                type="button"
                aria-label="개발자 필터 제거"
                onClick={() => setFilters((prev) => ({ ...prev, developers: undefined }))}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.hasDownload && (
            <Badge variant="secondary" className="gap-1">
              다운로드 가능
              <button
                type="button"
                aria-label="다운로드 필터 제거"
                onClick={() => setFilters((prev) => ({ ...prev, hasDownload: undefined }))}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

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
            <CardTitle className="text-destructive">오류 발생</CardTitle>
            <CardDescription>
              모드 데이터를 불러올 수 없습니다. API 연결을 확인해주세요.
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
                <CardTitle>{modsArray.length === 0 ? "모드 데이터가 없습니다" : "검색 결과가 없습니다"}</CardTitle>
                <CardDescription>
                  {modsArray.length === 0 ? "API에서 데이터를 가져오지 못했습니다." : "다른 키워드로 검색해보세요."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleMods.map((mod: Mod, index: number) => (
                <ModCard key={mod.id || mod._id || index} mod={mod} onOpen={openMod} eager={index < EAGER_CARDS} />
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
