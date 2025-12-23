"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, ExternalLink, Calendar, User, Loader2, AlertTriangle, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { ko, enUS } from "date-fns/locale"
import { useMods } from "@/components/mods-provider"
import { useLanguage } from "@/components/language-provider"
import { useRouter } from "next/navigation"

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
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // ID로 모드 가져오기
  useEffect(() => {
    async function loadMod() {
      setIsLoading(true)
      try {
        const modData = await getMod(params.id)

        if (modData) {
          setMod(modData)
          setError(null)
        } else {
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

  // 이전 페이지로 돌아가기 함수
  const handleGoBack = () => {
    // 브라우저의 히스토리를 사용하여 이전 페이지로 이동
    window.history.back()
  }

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
        <Button onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("mod.goBack")}
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

  // 디스코드 메시지 URL 생성
  const discordMessageUrl = (() => {
    // 모드 데이터에서 guild, channel, message 필드 추출
    const { guild, channel, message } = mod

    // 세 필드가 모두 있는 경우에만 URL 생성
    if (guild && channel && message) {
      return `https://discord.com/channels/${guild}/${channel}/${message}`
    }

    return null
  })()

  // Format upload time with correct locale
  const uploadTime = mod.uploadedTimestamp ? new Date(mod.uploadedTimestamp) : new Date()
  const formattedDate = format(uploadTime, "PPP", {
    locale: language === "ko" ? ko : enUS,
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <Button
        onClick={handleGoBack}
        className="inline-flex items-center text-primary hover:underline mb-6"
        variant="ghost"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t("mod.goBack")}
      </Button>

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
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{modName}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mt-2">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {modUsername}
              </div>
              <div>v{modVersion}</div>
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
                  {/* 다운로드 버튼 */}
                  <Button className="w-full" asChild>
                    <a href={modDownload} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      {t("mod.download")}
                    </a>
                  </Button>

                  {/* GitHub 페이지 버튼 */}
                  {mod.download && mod.download.includes("github.com") && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={mod.download} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t("mod.githubPage")}
                      </a>
                    </Button>
                  )}

                  {/* 디스코드 메시지 버튼 */}
                  {discordMessageUrl && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={discordMessageUrl} target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {t("mod.discordMessage")}
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
