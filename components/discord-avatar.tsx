"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getDiscordAvatarUrl, getDiscordDefaultAvatarUrl } from "@/lib/discord-utils"

interface DiscordAvatarProps {
  userId: string
  avatarHash?: string
  username?: string
  size?: number
  className?: string
}

export function DiscordAvatar({
  userId,
  avatarHash,
  username = "User",
  size = 80,
  className = "",
}: DiscordAvatarProps) {
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // 가능한 아바타 URL 목록
  const avatarUrls = avatarHash ? getDiscordAvatarUrl(userId, avatarHash, size) : [getDiscordDefaultAvatarUrl(userId)]

  // 현재 표시할 URL
  const currentUrl = error || currentUrlIndex >= avatarUrls.length ? "/default-avatar.png" : avatarUrls[currentUrlIndex]

  // 이미지 로딩 오류 처리
  const handleError = () => {
    if (currentUrlIndex < avatarUrls.length - 1) {
      // 다음 URL 시도
      setCurrentUrlIndex(currentUrlIndex + 1)
    } else {
      // 모든 URL이 실패하면 오류 상태로 설정
      setError(true)
      setIsLoading(false)
    }
  }

  // 이미지 로딩 완료 처리
  const handleLoad = () => {
    setIsLoading(false)
  }

  // 컴포넌트 마운트 시 로딩 상태 초기화
  useEffect(() => {
    setIsLoading(true)
    setError(false)
    setCurrentUrlIndex(0)
  }, [userId, avatarHash])

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <span className="sr-only">Loading avatar...</span>
        </div>
      )}
      <Image
        src={currentUrl || "/placeholder.svg"}
        alt={`${username}'s avatar`}
        width={size}
        height={size}
        className={`object-cover transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  )
}
