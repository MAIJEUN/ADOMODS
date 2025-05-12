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
  const [error, setError] = useState(false)

  // 기본 아바타 URL 생성
  const getDefaultAvatarUrl = () => {
    if (!userId) return "/default-avatar.png"

    // 디스코드 기본 아바타 (사용자 ID 마지막 숫자에 따라 0-5 중 하나)
    const discriminator = Number.parseInt(userId.slice(-1), 10) % 6
    return `https://cdn.discordapp.com/embed/avatars/${discriminator}.png`
  }

  // 아바타 URL 생성
  const getAvatarUrl = () => {
    if (error || !avatarHash || !userId) {
      return getDefaultAvatarUrl()
    }

    // 디스코드 아바타 URL
    return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=${size}`
  }

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      <Image
        src={getAvatarUrl() || "/placeholder.svg"}
        alt={`${username}'s avatar`}
        width={size}
        height={size}
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  )
}
