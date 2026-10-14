"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"
import { setLang, useT } from "@/lib/use-lang"

export function SiteNav() {
  const { t, lang } = useT()
  const pathname = usePathname()

  // <html lang> is rendered as "ko" on the server; follow the chosen language
  useEffect(() => {
    document.documentElement.lang = lang
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
      <Button variant="outline" size="sm" className="ml-2" onClick={() => setLang(lang === "ko" ? "en" : "ko")}>
        <Languages className="h-4 w-4" />
        {t("lang.switch")}
      </Button>
    </nav>
  )
}
