"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCcw } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">오류가 발생했습니다</h2>
      <p className="mb-8 text-muted-foreground">데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.</p>
      <div className="flex justify-center gap-4">
        <Button onClick={reset} variant="outline">
          <RefreshCcw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Link>
        </Button>
      </div>
    </div>
  )
}
