"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/components/language-provider"
import { useTheme } from "@/components/theme-provider"
import { HelpCircle, Languages, Moon, MoreVertical, Sun, Users } from "lucide-react"
import { useEffect, useState } from "react"

// 상수 정의
const MOD_INSTALL_GUIDE_URL = "https://adof.ai/mod"
const ADOFAI_DISCORD_URL = "https://discord.gg/adofaigg"

export function MoreMenu() {
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 마운트 후에만 테마 관련 UI 렌더링 (hydration 불일치 방지)
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label={t("header.moreMenu")}>
          <MoreVertical className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <div className="flex flex-col gap-2">
          {/* 언어 설정 버튼 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Languages className="h-4 w-4 mr-2" />
                {t("language.change")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setLanguage("ko")} className="flex items-center gap-2">
                <span>한국어</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("en")} className="flex items-center gap-2">
                <span>English</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 테마 설정 버튼 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <span className="flex h-4 w-4 items-center justify-center mr-2">
                  {mounted && (
                    <>
                      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </>
                  )}
                </span>
                {t("theme.change")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <span>{t("theme.light")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <span>{t("theme.dark")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center">
                  {mounted && (
                    <>
                      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </>
                  )}
                </span>
                <span>{t("theme.system")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 모드 설치 가이드 버튼 */}
          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
            <a href={MOD_INSTALL_GUIDE_URL} target="_blank" rel="noopener noreferrer">
              <HelpCircle className="h-4 w-4 mr-2" />
              {t("mod.installGuide")}
            </a>
          </Button>

          {/* ADOFAI 디스코드 서버 버튼 */}
          <Button variant="outline" size="sm" className="w-full justify-start" asChild>
            <a href={ADOFAI_DISCORD_URL} target="_blank" rel="noopener noreferrer">
              <Users className="h-4 w-4 mr-2" />
              {t("mod.discordServer")}
            </a>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
