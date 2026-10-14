"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Database, Github, MessageCircle } from "lucide-react"
import { useT } from "@/lib/use-lang"

const DISCORD_CONTACT = "maijeun"
const GITHUB_URL = "https://github.com/MAIJEUN/ADOMODS"
const DATA_URL = "https://bot.adofai.gg/api/mods/"

// Discord handles can't be linked to without the user ID, so the handle is copied instead
function DiscordContact() {
  const { t } = useT()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      title={t("footer.copyHandle")}
      className="inline-flex items-center gap-1.5 text-foreground hover:text-primary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(DISCORD_CONTACT)
          setCopied(true)
        } catch {
          // Clipboard blocked; the handle is still visible
        }
      }}
    >
      @{DISCORD_CONTACT}
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 opacity-60" />}
      {copied && <span className="text-xs text-primary">{t("detail.copied")}</span>}
    </button>
  )
}

const linkClass = "inline-flex items-center gap-1.5 text-foreground hover:text-primary hover:underline"

export function SiteFooter() {
  const { t } = useT()

  return (
    <footer className="border-t border-border mt-16">
      <div className="container mx-auto grid gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div className="space-y-2">
          <p className="font-semibold">
            <span className="text-primary">ADO</span>MODS
          </p>
          <p className="text-muted-foreground">{t("footer.about")}</p>
        </div>

        <div className="space-y-2">
          <p className="font-semibold">{t("footer.contact")}</p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            {t("footer.discord")}
            <DiscordContact />
          </p>
          <p className="text-muted-foreground">{t("footer.contactHint")}</p>
        </div>

        <div className="space-y-2">
          <p className="font-semibold">{t("footer.links")}</p>
          <ul className="space-y-1.5">
            <li>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <Github className="h-4 w-4" />
                {t("footer.source")}
              </a>
            </li>
            <li>
              <a href={DATA_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <Database className="h-4 w-4" />
                {t("footer.data")}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        {/* Extra bottom space on phones so the back-to-top button doesn't cover the text */}
        <p className="container mx-auto px-4 pt-4 pb-20 text-center text-xs text-muted-foreground sm:pb-4">
          {t("footer.disclaimer")}
        </p>
      </div>
    </footer>
  )
}
