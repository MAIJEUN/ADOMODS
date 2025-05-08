"use client"

import { Suspense } from "react"
import ModsGrid from "@/components/mods-grid"
import SearchBar from "@/components/search-bar"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function Home() {
  // URL 쿼리 파라미터 추출
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const sort = searchParams.get("sort") || "uploadedTimestamp"

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 제목 제거 (헤더에 로고와 사이트명이 있으므로) */}
      <div className="mb-6">
        <SearchBar initialQuery={query} initialSort={sort} />
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">로딩 중...</span>
          </div>
        }
      >
        <ModsGrid query={query} sort={sort} />
      </Suspense>
    </main>
  )
}
