"use client"

import { Button } from "@/components/ui/button"
import { RefreshCcw } from "lucide-react"

interface FallbackMessageProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function FallbackMessage({
  title = "데이터를 불러올 수 없습니다",
  message = "API에 연결할 수 없거나 응답이 유효하지 않습니다. 잠시 후 다시 시도해주세요.",
  onRetry,
}: FallbackMessageProps) {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCcw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
      )}
    </div>
  )
}
