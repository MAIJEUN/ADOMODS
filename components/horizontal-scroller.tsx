"use client"

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useT } from "@/lib/use-lang"

// A horizontally scrolling row without a scrollbar: edge fades and arrow buttons show when there's
// more to see. Touch screens and trackpads scroll it directly; the arrows are for mouse users.
export function HorizontalScroller({ children, className }: { children: ReactNode; className?: string }) {
  const { t } = useT()
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 1)
    // -1 absorbs sub-pixel rounding at the end
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [update])

  const scrollByPage = (direction: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" })
  }

  const arrowClass =
    "absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md hover:bg-muted sm:flex"

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={update}
        className={`flex snap-x overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ""}`}
      >
        {children}
      </div>

      {/* Fades hint that the row continues */}
      {canLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
      )}
      {canRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
      )}

      {canLeft && (
        <button type="button" aria-label={t("common.scrollLeft")} onClick={() => scrollByPage(-1)} className={`${arrowClass} -left-3`}>
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {canRight && (
        <button type="button" aria-label={t("common.scrollRight")} onClick={() => scrollByPage(1)} className={`${arrowClass} -right-3`}>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
