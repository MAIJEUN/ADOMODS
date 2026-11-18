"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { CN, FR, JP, KR, US } from "country-flag-icons/react/3x2"
import { LANG_NAMES, LANGS, localeOf, type Lang } from "@/lib/i18n"
import { setLang, useT } from "@/lib/use-lang"

// SVG flags rather than emoji: Windows shows flag emoji as two letters
const FLAGS: Record<Lang, typeof KR> = { ko: KR, en: US, zh: CN, ja: JP, fr: FR }

function Flag({ lang }: { lang: Lang }) {
  const Icon = FLAGS[lang]
  return <Icon aria-hidden className="h-3 w-[18px] shrink-0 rounded-[2px] ring-1 ring-white/10" />
}

export function SiteNav() {
  const { t, lang } = useT()
  const pathname = usePathname()

  // <html lang> is rendered as "ko" on the server; follow the chosen language
  useEffect(() => {
    document.documentElement.lang = localeOf(lang)
  }, [lang])

  const links = [
    { href: "/", label: t("nav.mods"), active: pathname === "/" || pathname === "/mods" || pathname.startsWith("/mods/") },
    { href: "/developers", label: t("nav.developers"), active: pathname.startsWith("/developers") },
  ]

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.active ? "page" : undefined}
          className={`rounded-md px-2 py-1 text-sm transition-colors ${
            link.active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {link.label}
        </Link>
      ))}
      <Select value={lang} onValueChange={(value) => setLang(value as Lang)}>
        <SelectTrigger
          size="sm"
          aria-label={t("lang.label")}
          className="ml-1 gap-1.5 border-transparent bg-transparent text-muted-foreground shadow-none hover:text-foreground dark:bg-transparent dark:hover:bg-transparent"
        >
          <Flag lang={lang} />
          {LANG_NAMES[lang]}
        </SelectTrigger>
        <SelectContent align="end">
          {LANGS.map((code) => (
            <SelectItem key={code} value={code} lang={localeOf(code)}>
              <Flag lang={code} />
              {LANG_NAMES[code]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </nav>
  )
}
