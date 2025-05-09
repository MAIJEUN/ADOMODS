"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { useState } from "react"

interface ModCardProps {
  mod: {
    _id?: string
    id: string
    name: string
    version: string
    description: string
    download: string
    parsedDownload?: string
    cachedUsername: string
    cachedAvatar?: string
    user: string
    uploadedTimestamp: number
  }
}

export function ModCard({ mod }: ModCardProps) {
  const [imageError, setImageError] = useState(false)

  // Discord avatar URL - 개선된 URL 구성
  const avatarUrl =
    !imageError && mod.cachedAvatar
      ? `https://cdn.discordapp.com/avatars/${mod.user}/${mod.cachedAvatar}.webp?size=80`
      : "/default-avatar.png" // 기본 아바타 이미지 사용

  // Format upload time
  const uploadTime = mod.uploadedTimestamp ? new Date(mod.uploadedTimestamp) : new Date()
  const timeAgo = formatDistanceToNow(uploadTime, { addSuffix: true, locale: ko })

  // Get short description (first paragraph)
  const shortDescription = mod.description
    ? mod.description.split("\n")[0].replace(/^#\s*/, "")
    : "No description available."

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow dark:border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 relative rounded-full overflow-hidden flex-shrink-0 border dark:border-slate-700 bg-muted">
            <Image
              src={avatarUrl || "/placeholder.svg"}
              alt={`${mod.cachedUsername} avatar`}
              fill
              className="object-cover"
              onError={() => {
                setImageError(true)
              }}
            />
          </div>
          <div>
            <CardTitle className="text-lg line-clamp-1">{mod.name}</CardTitle>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <span className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                {mod.cachedUsername}
              </span>
              <span className="mx-1">•</span>
              <span>v{mod.version}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="line-clamp-3 min-h-[4.5rem]">{shortDescription}</CardDescription>

        <div className="flex items-center text-xs text-muted-foreground mt-3">
          <Calendar className="h-3 w-3 mr-1" />
          {timeAgo}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t dark:border-slate-700">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/mod/${mod.id}`}>자세히 보기</Link>
        </Button>
        <Button size="sm" asChild>
          <a href={mod.parsedDownload || mod.download} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-1" />
            다운로드
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
