"use client"

import { useMods } from "@/components/mods-provider"
import { DataRefreshButton } from "@/components/data-refresh-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "@/components/theme-provider"

export function Header() {
  const { lastUpdated, error } = useMods()
  const [isOnline, setIsOnline] = useState(true)
  const { theme } = useTheme()

  // 테마에 따라 로고 이미지 선택
  const logoSrc = theme === "dark" ? "/logo.png" : "/logo-dark.png"

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
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(lastUpdated)
    : "알 수 없음"

  return (
    <div className="bg-muted/40 border-b dark:border-slate-700 dark:bg-slate-900/60">
      <div className="container mx-auto px-4 py-2">
        {/* 로고와 사이트 이름 */}
        <div className="flex items-center justify-between py-2 border-b dark:border-slate-700">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10 overflow-hidden">
              <Image
                src={logoSrc || "/placeholder.svg"}
                alt="ADOMODS 로고"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight">ADOMODS</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* 상태 정보 및 버튼 */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 py-2">
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">마지막 업데이트: {formattedLastUpdated}</div>

            {/* 네트워크 상태 표시 */}
            {!isOnline && (
              <div className="text-sm bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-md">
                오프라인 모드
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
