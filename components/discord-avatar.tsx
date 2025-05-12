"use client"

import { useState } from "react"
import Image from "next/image"

interface DiscordAvatarProps {
  userId: string
  avatarHash?: string // 이제 이 값은 사용하지 않지만 호환성을 위해 유지
  username?: string
  size?: number
  className?: string
}

export function DiscordAvatar({
  userId,
  avatarHash, // 사용하지 않음
  username = "User",
  size = 80,
  className = "",
}: DiscordAvatarProps) {
  const [error, setError] = useState(false)

  // 새로운 API URL 생성
  const getAvatarUrl = () => {
    if (!userId || error) {
      return "/default-avatar.png"
    }

    // 제공된 API 사용
    return `https://avatar-cyan.vercel.app/api/pfp/${userId}/image`
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
