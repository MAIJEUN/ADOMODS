"use client"

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react"
import { ChevronDown, ChevronUp, Info } from "lucide-react"
import { useT } from "@/lib/use-lang"
import { FooterSections, SITE_FOOTER_ID } from "@/components/site-footer"

// Hover intent: a mouse just passing the bottom edge shouldn't pop the panel open
const OPEN_DELAY_MS = 150
const CLOSE_DELAY_MS = 300

// Bottom-center "Info" tab that slides up the footer's contact/links panel, so it's reachable
// without scrolling past the (infinitely loading) list. Opens on hover (or touching the bottom
// edge with the mouse) on desktop and on tap on touch screens.
export function InfoTab() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [footerVisible, setFooterVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const openSoon = useCallback((e: PointerEvent) => {
    if (e.pointerType !== "mouse") return
    clearTimeout(closeTimer.current)
    openTimer.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS)
  }, [])

  const closeSoon = useCallback((e: PointerEvent) => {
    if (e.pointerType !== "mouse") return
    clearTimeout(openTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }, [])

  const keepOpen = useCallback((e: PointerEvent) => {
    if (e.pointerType === "mouse") clearTimeout(closeTimer.current)
  }, [])

  useEffect(
    () => () => {
      clearTimeout(openTimer.current)
      clearTimeout(closeTimer.current)
    },
    [],
  )

  // The real footer already shows everything; step aside while it's on screen
  useEffect(() => {
    const footer = document.getElementById(SITE_FOOTER_ID)
    if (!footer) return
    const observer = new IntersectionObserver(([entry]) => {
      setFooterVisible(entry.isIntersecting)
      if (entry.isIntersecting) setOpen(false)
    })
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  // Escape or a tap/click outside closes it
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("pointerdown", onPointerDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [open])

  // Closed: only the 2.25rem tab peeks out; footer visible: fully hidden
  const position = footerVisible ? "translate-y-full" : open ? "translate-y-0" : "translate-y-[calc(100%-2.25rem)]"

  return (
    <>
      {!open && !footerVisible && (
        <div
          aria-hidden
          className="fixed inset-x-0 bottom-0 z-30 h-1.5"
          onPointerEnter={openSoon}
          onPointerLeave={closeSoon}
        />
      )}

      <div
        ref={containerRef}
        onPointerEnter={keepOpen}
        onPointerLeave={closeSoon}
        // The wrapper is click-through so the bottom edge beside the tab still reaches the hover zone
        className={`pointer-events-none fixed bottom-0 left-1/2 z-40 flex w-full max-w-3xl -translate-x-1/2 flex-col items-center transition-transform duration-300 ease-out ${position}`}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="info-panel"
          onClick={() => setOpen((value) => !value)}
          onPointerEnter={openSoon}
          className="pointer-events-auto flex h-9 items-center gap-1.5 rounded-t-lg border border-b-0 border-border bg-card px-4 text-xs font-medium text-muted-foreground shadow-lg hover:text-foreground"
        >
          <Info className="h-3.5 w-3.5" />
          {t("footer.tab")}
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        <div
          id="info-panel"
          // Hidden panel's links shouldn't be reachable by Tab
          inert={!open}
          className="pointer-events-auto max-h-[70vh] w-full overflow-y-auto rounded-t-xl border border-b-0 border-border bg-card shadow-2xl"
        >
          <FooterSections className="p-6" />
          <p className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
            {t("footer.disclaimer")}
          </p>
        </div>
      </div>
    </>
  )
}
