"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, ExternalLink, Calendar, User, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { ko, enUS } from "date-fns/locale"
import { useMods } from "@/components/mods-provider"
import { useLanguage } from "@/components/language-provider"

// 간단한 마크다운 파서 (기본 기능만 지원)
function SimpleMarkdown({ content }: { content: string }) {
  const { t } = useLanguage()

  if (!content || typeof content !== "string") {
    return <p className="text-muted-foreground">{t("mod.noDescription")}</p>
  }

  try {
    // 기본적인 마크다운 변환 (헤더, 굵게, 기울임, 링크)
    const formattedContent = content
      // 헤더 처리
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      // 굵게 처리
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // 기울임 처리
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // 링크 처리
      .replace(
        /\[(.*?)\]$$(.*?)$$/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>',
      )
      // 줄바꿈 처리
      .replace(/\n/g, "<br />")

    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />
  } catch (error) {
    console.error("Error parsing markdown:", error)
    return <p className="text-muted-foreground">{content}</p>
  }
}

export default function ModPage({ params }: { params: { id: string } }) {
  const { isLoading: isModsLoading, error: modsError, getMod } = useMods()
  const { language, t } = useLanguage()
  const [mod, setMod] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ID로 모드 가져오기
  useEffect(() => {
    async function loadMod() {
      setIsLoading(true)
      try {
        console.log("Fetching mod with ID:", params.id)
        const modData = await getMod(params.id)

        if (modData) {
          console.log("Found mod:", modData)
          setMod(modData)
          setError(null)
        } else {
          console.log("Mod not found")
          setMod(null)
          setError(`${t("mod.notFound")}: '${params.id}'`)
        }
      } catch (err: any) {
        console.error("Error loading mod:", err)
        setMod(null)
        setError(`${t("error.message")}: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadMod()
  }, [params.id, getMod, t])

  // 로딩 중일 때
  if (isLoading || isModsLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t("mods.loading")}</span>
      </div>
    )
  }

  // 모드를 찾지 못했을 때
  if (!mod) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("mod.notFound")}</h1>
        <p className="mb-6">{error || t("mod.notFound")}</p>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("error.backToHome")}
          </Link>
        </Button>
      </div>
    )
  }

  // 안전하게 모드 데이터 접근
  const modName = mod.name || t("mod.unknown")
  const modVersion = mod.version || t("mod.noVersion")
  const modUsername = mod.cachedUsername || t("mod.unknownUser")
  const modDescription = mod.description || t("mod.noDescription")
  const modDownload = mod.parsedDownload || mod.download || "#"
  const modUser = mod.user || ""

  // Discord avatar URL
  const avatarUrl =
    !imageError && mod.cachedAvatar
      ? `https://cdn.discordapp.com/avatars/${modUser}/${mod.cachedAvatar}.webp?size=128`
      : "/default-avatar.png"

  // Format upload time with correct locale
  const uploadTime = mod.uploadedTimestamp ? new Date(mod.uploadedTimestamp) : new Date()
  const formattedDate = format(uploadTime, "PPP", {
    locale: language === "ko" ? ko : enUS,
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center text-primary hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t("mod.backToList")}
      </Link>

      {(modsError || error) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400">
          <p className="text-sm font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            {modsError || error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 relative rounded-full overflow-hidden border dark:border-slate-700 bg-muted">
              <Image
                src={avatarUrl || "/placeholder.svg"}
                alt={`${modUsername} avatar`}
                fill
                className="object-cover"
                onError={() => {
                  setImageError(true)
                }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{modName}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {modUsername}
                </div>
                <div>v{modVersion}</div>
              </div>
            </div>
          </div>

          <Card className="mb-6 dark:border-slate-700">
            <CardContent className="pt-6 prose prose-sm max-w-none dark:prose-invert">
              <SimpleMarkdown content={modDescription} />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">{t("mod.uploadDate")}</h3>
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formattedDate}
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <Button className="w-full" asChild>
                    <a href={modDownload} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      {t("mod.download")}
                    </a>
                  </Button>

                  {mod.download && mod.download.includes("github.com") && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={mod.download} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t("mod.githubPage")}
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
