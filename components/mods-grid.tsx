"use client"

import { useMemo } from "react"
import { ModCard } from "@/components/mod-card"
import { SortIcon } from "@/components/sort-icon"
import { useMods } from "@/components/mods-provider"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { RefreshCcw, Loader2 } from "lucide-react"

interface ModsGridProps {
  query?: string
  sort?: string
}

// 클라이언트 측에서 모드 데이터 필터링 및 정렬
function filterAndSortMods(mods: any[], query = "", sort = "uploadedTimestamp") {
  // 검색어로 필터링
  let filteredMods = mods
  if (query) {
    const lowerQuery = query.toLowerCase()
    filteredMods = mods.filter(
      (mod) =>
        (mod.name?.toLowerCase() || "").includes(lowerQuery) ||
        (mod.description?.toLowerCase() || "").includes(lowerQuery) ||
        (mod.cachedUsername?.toLowerCase() || "").includes(lowerQuery),
    )
  }

  // 정렬
  return [...filteredMods].sort((a, b) => {
    switch (sort) {
      case "name":
        return (a.name || "").localeCompare(b.name || "")
      case "version":
        return (b.version || "").localeCompare(a.version || "")
      case "uploadedTimestamp":
      default:
        return (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0)
    }
  })
}

export default function ModsGrid({ query = "", sort = "uploadedTimestamp" }: ModsGridProps) {
  const { mods, isLoading, error, lastUpdated, refreshMods } = useMods()
  const { language, t } = useLanguage()

  // 필터링 및 정렬된 모드 목록
  const filteredMods = useMemo(() => {
    // 버전 정보가 있는 모드만 필터링 (클라이언트 측에서 한 번 더 확인)
    const modsWithVersion = mods.filter((mod) => mod.version && mod.version.trim() !== "")
    return filterAndSortMods(modsWithVersion, query, sort)
  }, [mods, query, sort])

  // 마지막 업데이트 시간 포맷팅
  const formattedLastUpdated = lastUpdated
    ? new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastUpdated)
    : t("header.unknown")

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t("mods.loading")}</span>
      </div>
    )
  }

  // 검색 결과가 없는 경우
  if (filteredMods.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium mb-2">{t("mods.noResults")}</p>
        <p className="text-muted-foreground mb-4">
          {query ? `${t("mods.noResultsFor")} "${query}"` : t("mods.notFound")}
        </p>
        <Button onClick={refreshMods} variant="outline">
          <RefreshCcw className="h-4 w-4 mr-2" />
          {t("mods.refreshData")}
        </Button>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6 text-yellow-800">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <p className="text-sm text-muted-foreground">
          {filteredMods.length} {t("mods.count")} {query && `(${t("mods.searchResult")}: "${query}")`}
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
          <span className="flex items-center">
            {t("header.lastUpdated")}: {formattedLastUpdated}
            <Button onClick={refreshMods} variant="ghost" size="icon" className="ml-1 h-6 w-6">
              <RefreshCcw className="h-3 w-3" />
            </Button>
          </span>

          <span className="font-medium flex items-center">
            {t("search.sortBy")}:{sort === "uploadedTimestamp" && ` ${t("search.sortByLatest")}`}
            {sort === "name" && ` ${t("search.sortByName")}`}
            {sort === "version" && ` ${t("search.sortByVersion")}`}
            <SortIcon sort={sort} />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredMods.map((mod: any) => (
          <ModCard key={mod.id || mod._id} mod={mod} />
        ))}
      </div>
    </>
  )
}
