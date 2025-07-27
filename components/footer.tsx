"use client"

import Link from "next/link"
import { Github } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { useState } from "react"
import { FooterHandle } from "@/components/footer-handle"

export function Footer() {
  const { t } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(false)
  const currentYear = new Date().getFullYear()

  const toggleExpanded = () => setIsExpanded(!isExpanded)

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-10 transition-all duration-300 ease-in-out bg-background border-t dark:border-slate-700 shadow-md"
      style={{
        height: isExpanded ? "160px" : "8px",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* 푸터 핸들 - 항상 표시되는 부분 */}
      <FooterHandle isExpanded={isExpanded} toggleExpanded={toggleExpanded} />

      {/* 푸터 콘텐츠 - 펼쳐질 때만 표시 */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} MAIJSOFT Dev. {t("footer.allRightsReserved")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("footer.license")}:{" "}
              <Link
                href="https://www.gnu.org/licenses/gpl-3.0.en.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                GNU General Public License v3.0
              </Link>
            </p>
            <p className="text-sm text-muted-foreground text-center md:text-left">{t("footer.gameDisclaimer")}</p>
            <p className="text-sm text-muted-foreground text-center md:text-left">{t("footer.siteDisclaimer")}</p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/MAIJEUN/ADOMODS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>{t("footer.sourceCode")}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
