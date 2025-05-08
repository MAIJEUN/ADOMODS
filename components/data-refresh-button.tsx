"use client"

import { Button } from "@/components/ui/button"
import { RefreshCcw, Loader2 } from "lucide-react"
import { useState } from "react"
import { useMods } from "@/components/mods-provider"
import { clearModsStorage } from "@/lib/storage"

export function DataRefreshButton() {
  const { refreshMods } = useMods()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      // 스토리지 초기화 (강제로 새로운 데이터 가져오기)
      clearModsStorage()

      // 데이터 새로고침
      await refreshMods()
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
      {isRefreshing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          새로고침 중...
        </>
      ) : (
        <>
          <RefreshCcw className="h-4 w-4 mr-2" />
          데이터 새로고침
        </>
      )}
    </Button>
  )
}
