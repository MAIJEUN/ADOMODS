"use client"

import Link from "next/link"
import { Github } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function Footer() {
  const { t } = useLanguage()

  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto py-6 border-t dark:border-slate-700">
      <div className="container mx-auto px-4">
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
