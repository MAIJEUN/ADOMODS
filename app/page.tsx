"use client"

import { Suspense } from "react"
import ModsGrid from "@/components/mods-grid"
import SearchBar from "@/components/search-bar"
import { Loader2, HelpCircle, Users } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"
import { useMediaQuery } from "@/hooks/use-media-query"

// 상수 정의
const MOD_INSTALL_GUIDE_URL = "https://adof.ai/mod"
const ADOFAI_DISCORD_URL = "https://discord.gg/adofaigg"

export default function Home() {
  // URL 쿼리 파라미터 추출
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const sort = searchParams.get("sort") || "uploadedTimestamp"
  const { t } = useLanguage()
  const isMobile = useMediaQuery("(max-width: 768px)")

  return (
    <main className="container mx-auto px-4 py-8">
      {/* 제목 제거 (헤더에 로고와 사이트명이 있으므로) */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <SearchBar initialQuery={query} initialSort={sort} />

          {!isMobile && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={MOD_INSTALL_GUIDE_URL} target="_blank" rel="noopener noreferrer">
                  <HelpCircle className="h-4 w-4 mr-1" />
                  {t("mod.installGuide")}
                </a>
              </Button>

              <Button variant="outline" size="sm" asChild>
                <a href={ADOFAI_DISCORD_URL} target="_blank" rel="noopener noreferrer">
                  <Users className="h-4 w-4 mr-1" />
                  {t("mod.discordServer")}
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{t("mods.loading")}</span>
          </div>
        }
      >
        <ModsGrid query={query} sort={sort} />
      </Suspense>
    </main>
  )
}
