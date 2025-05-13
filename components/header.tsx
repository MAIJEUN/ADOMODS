"use client"

import { useMods } from "@/components/mods-provider"
import { DataRefreshButton } from "@/components/data-refresh-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { MoreMenu } from "@/components/more-menu"
import { useLanguage } from "@/components/language-provider"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "@/components/theme-provider"
import { useMediaQuery } from "@/hooks/use-media-query"

export function Header() {
  const { lastUpdated, error } = useMods()
  const [isOnline, setIsOnline] = useState(true)
  const { theme } = useTheme()
  const { t } = useLanguage()
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const isMobile = useMediaQuery("(max-width: 768px)")

  // 실제 적용되는 테마 감지
  useEffect(() => {
    // 테마가 'system'인 경우 시스템 설정 확인
    if (theme === "system") {
      const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches
      setResolvedTheme(isDarkMode ? "dark" : "light")

      // 시스템 테마 변경 감지
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? "dark" : "light")
      }

      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    } else {
      // 'system'이 아닌 경우 직접 설정된 테마 사용
      setResolvedTheme(theme as "light" | "dark")
    }
  }, [theme])

  // 테마에 따라 로고 이미지 선택 (실제 적용되는 테마 기준)
  const logoSrc = resolvedTheme === "dark" ? "/logo-white.png" : "/logo-black.png"

  // 네트워크 상태 모니터링
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // 초기 상태 설정
    setIsOnline(navigator.onLine)

    // 이벤트 리스너 등록
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // 클린업
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // 마지막 업데이트 시간 포맷팅
  const formattedLastUpdated = lastUpdated
    ? new Intl.DateTimeFormat(t("language.ko") === "한국어" ? "ko-KR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastUpdated)
    : t("header.unknown")

  return (
    <div className="bg-muted/40 border-b dark:border-slate-700 dark:bg-slate-900/60">
      <div className="container mx-auto px-4 py-2">
        {/* 로고와 사이트 이름 */}
        <div className="flex items-center justify-between py-2 border-b dark:border-slate-700">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-12 h-12 overflow-hidden">
              <Image
                src={logoSrc || "/placeholder.svg"}
                alt="ADOMODS 로고"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight">{t("app.title")}</span>
          </Link>
          <div className="flex items-center gap-2">
            {isMobile ? (
              <MoreMenu />
            ) : (
              <>
                <LanguageToggle />
                <ThemeToggle />
              </>
            )}
          </div>
        </div>

        {/* 상태 정보 및 버튼 */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 py-2">
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {t("header.lastUpdated")}: {formattedLastUpdated}
            </div>

            {/* 네트워크 상태 표시 */}
            {!isOnline && (
              <div className="text-sm bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-md">
                {t("header.offlineMode")}
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-md">
              {error}
            </div>
          )}

          <DataRefreshButton />
        </div>
      </div>
    </div>
  )
}
