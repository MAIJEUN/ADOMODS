"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Languages } from "lucide-react"
import { LANG_NAMES, LANGS, localeOf, type Lang } from "@/lib/i18n"
import { setLang, useT } from "@/lib/use-lang"

export function SiteNav() {
  const { t, lang } = useT()
  const pathname = usePathname()

  // <html lang> is rendered as "ko" on the server; follow the chosen language
  useEffect(() => {
    document.documentElement.lang = localeOf(lang)
  }, [lang])

  const links = [
    { href: "/", label: t("nav.mods"), active: pathname === "/" || pathname.startsWith("/mods/") },
    { href: "/developers", label: t("nav.developers"), active: pathname.startsWith("/developers") },
  ]

  return (
    <nav className="flex items-center gap-1">
      {links.map((link) => (
        <Button key={link.href} variant={link.active ? "secondary" : "ghost"} size="sm" asChild>
          <Link href={link.href}>{link.label}</Link>
        </Button>
      ))}
      <Select value={lang} onValueChange={(value) => setLang(value as Lang)}>
        <SelectTrigger size="sm" aria-label={t("lang.label")} className="ml-2 gap-1.5">
          <Languages className="h-4 w-4" />
          {LANG_NAMES[lang]}
        </SelectTrigger>
        <SelectContent align="end">
          {LANGS.map((code) => (
            <SelectItem key={code} value={code} lang={localeOf(code)}>
              {LANG_NAMES[code]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </nav>
  )
}
