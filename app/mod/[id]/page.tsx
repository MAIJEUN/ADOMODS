"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, ExternalLink, Calendar, User, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import ReactMarkdown from "react-markdown"
import { useMods } from "@/components/mods-provider"

export default function ModPage({ params }: { params: { id: string } }) {
  const { mods, isLoading, error } = useMods()
  const [mod, setMod] = useState<any>(null)

  // ID로 모드 찾기
  useEffect(() => {
    if (mods.length > 0) {
      const foundMod = mods.find((m: any) => m.id === params.id)
      setMod(foundMod || null)
    }
  }, [mods, params.id])

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">모드 정보를 불러오는 중...</span>
      </div>
    )
  }

  // 모드를 찾지 못했을 때
  if (!mod) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">모드를 찾을 수 없습니다</h1>
        <p className="mb-6">요청하신 모드를 찾을 수 없습니다.</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            홈으로 돌아가기
          </Link>
        </Button>
      </div>
    )
  }

  // Discord avatar URL
  const avatarUrl = mod.cachedAvatar
    ? `https://cdn.discordapp.com/avatars/${mod.user}/${mod.cachedAvatar}.webp?size=128`
    : `https://cdn.discordapp.com/embed/avatars/0.png`

  // Format upload time
  const uploadTime = mod.uploadedTimestamp ? new Date(mod.uploadedTimestamp) : new Date()
  const formattedDate = format(uploadTime, "PPP", { locale: ko })

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center text-primary hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        모든 모드 보기
      </Link>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 relative rounded-full overflow-hidden border dark:border-slate-700">
              <Image
                src={avatarUrl || "/placeholder.svg"}
                alt={`${mod.cachedUsername} avatar`}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "https://cdn.discordapp.com/embed/avatars/0.png"
                }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{mod.name}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {mod.cachedUsername}
                </div>
                <div>v{mod.version}</div>
              </div>
            </div>
          </div>

          <Card className="mb-6 dark:border-slate-700">
            <CardContent className="pt-6 prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{mod.description || "설명이 없습니다."}</ReactMarkdown>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">업로드 날짜</h3>
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formattedDate}
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <Button className="w-full" asChild>
                    <a href={mod.parsedDownload || mod.download} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      다운로드
                    </a>
                  </Button>

                  {mod.download && mod.download.includes("github.com") && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={mod.download} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        GitHub 페이지
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
