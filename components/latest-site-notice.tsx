"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/language-provider"

const LATEST_URL = "https://adomods.kro.kr"
const SEEN_KEY = "adomods-legacy-notice-seen"

// This is the old version of the site: tell visitors on every visit (unless they opted out) and offer
// the current one
export function LatestSiteNotice() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const goRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true)
    } catch {
      setOpen(true)
    }
  }, [])

  const close = () => {
    setOpen(false)
    if (!dontShowAgain) return
    try {
      localStorage.setItem(SEEN_KEY, "1")
    } catch {
      // Storage blocked; the notice just shows again next visit
    }
  }

  useEffect(() => {
    if (open) goRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // close reads dontShowAgain, so re-subscribe when it changes
  }, [open, dontShowAgain])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legacy-notice-title"
        className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="legacy-notice-title" className="text-lg font-semibold">
          {t("legacy.title")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground break-keep">{t("legacy.notice")}</p>
        <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-current"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          {t("legacy.dontShowAgain")}
        </label>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={close}>
            {t("legacy.stay")}
          </Button>
          <Button asChild>
            <a ref={goRef} href={LATEST_URL} onClick={close}>
              {t("legacy.goLatest")}
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
