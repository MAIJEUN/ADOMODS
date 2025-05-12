"use client"

import { useState } from "react"
import Image from "next/image"

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
  const [customAvatarError, setCustomAvatarError] = useState(false)

  // 사용자 ID에 기반한 기본 아바타 URL 생성
  const getDefaultAvatarUrl = () => {
    if (!userId) return "/default-avatar.png"

    // 디스코드 기본 아바타 (사용자 ID 마지막 숫자에 따라 0-5 중 하나)
    const discriminator = Number.parseInt(userId.slice(-1), 10) % 6
    return `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`
  }

  // 아바타 URL 결정
  const getAvatarUrl = () => {
    // 커스텀 아바타가 있고 오류가 없는 경우
    if (avatarHash && !customAvatarError && userId) {
      return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=${size}`
    }

    // 그 외의 경우 기본 아바타 사용
    return getDefaultAvatarUrl()
  }

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      <Image
        src={getAvatarUrl() || "/placeholder.svg"}
        alt={`${username}'s avatar`}
        width={size}
        height={size}
        className="object-cover"
        onError={() => {
          // 커스텀 아바타 로딩 실패 시 기본 아바타로 대체
          setCustomAvatarError(true)
        }}
        unoptimized
      />
    </div>
  )
}
