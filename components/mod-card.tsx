"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, User } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { ko, enUS } from "date-fns/locale"

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
    cachedAvatar?: string // 더 이상 사용하지 않음
    user: string // 더 이상 사용하지 않음
    uploadedTimestamp: number
  }
}

export function ModCard({ mod }: ModCardProps) {
  const { language, t } = useLanguage()

  // Format upload time with correct locale
  const uploadTime = mod.uploadedTimestamp ? new Date(mod.uploadedTimestamp) : new Date()
  const timeAgo = formatDistanceToNow(uploadTime, {
    addSuffix: true,
    locale: language === "ko" ? ko : enUS,
  })

  // Get short description (첫 번째 헤더 제거 후 첫 번째 단락)
  const shortDescription = (() => {
    // 마크다운에서 첫 번째 줄이 # 헤더인 경우 제거
    const lines = mod.description?.split("\n") || []
    const nonHeaderLines = lines.filter((line) => !line.trim().startsWith("#"))

    // 첫 번째 비어있지 않은 텍스트 줄 찾기
    const firstTextLine = nonHeaderLines.find((line) => line.trim() !== "")

    return firstTextLine?.trim() || t("mod.noDescription")
  })()

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow dark:border-slate-700">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-lg line-clamp-1">{mod.name}</CardTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <span className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {mod.cachedUsername || t("mod.unknownUser")}
            </span>
            <span className="mx-1">•</span>
            <span>v{mod.version}</span>
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
          <Link href={`/mod/${mod.id}`}>{t("mod.details")}</Link>
        </Button>
        <Button size="sm" asChild>
          <a href={mod.parsedDownload || mod.download} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-1" />
            {t("mod.download")}
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
