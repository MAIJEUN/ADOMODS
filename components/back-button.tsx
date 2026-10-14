"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { TranslationKey } from "@/lib/i18n"
import { useT } from "@/lib/use-lang"

// In-app navigation history, mirrored from pathname changes by <NavigationTracker /> in the layout.
// Returning to the second-to-last path counts as "back" and pops, so a mod dialog that was opened and
// closed (pushes /mods/... then goes back) leaves the stack as it was.
let stack: string[] = []
const listeners = new Set<() => void>()
const EMPTY: readonly string[] = []

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function NavigationTracker() {
  const pathname = usePathname()
  // Recorded during render (not in an effect) so the page rendering for this path already sees it
  if (stack[stack.length - 1] !== pathname) {
    stack = stack[stack.length - 2] === pathname ? stack.slice(0, -1) : [...stack, pathname]
    queueMicrotask(() => listeners.forEach((listener) => listener()))
  }
  return null
}

const labelFor = (path: string): TranslationKey =>
  path === "/" ? "common.allMods" : path === "/developers" ? "common.developerList" : "common.back"

// Goes back to wherever the user came from inside the site; on a direct visit, links to `fallbackHref`
export function BackButton({ fallbackHref, fallbackLabel }: { fallbackHref: string; fallbackLabel: TranslationKey }) {
  const { t } = useT()
  const router = useRouter()
  const pathname = usePathname()
  const history = useSyncExternalStore(subscribe, () => stack, () => EMPTY)
  const index = history.lastIndexOf(pathname)
  const previous = index > 0 ? history[index - 1] : null

  if (!previous) {
    return (
      // scroll={false}: the list restores its own scroll position
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={fallbackHref} scroll={false}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t(fallbackLabel)}
        </Link>
      </Button>
    )
  }

  return (
    <Button variant="ghost" size="sm" className="-ml-2" onClick={() => router.back()}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      {t(labelFor(previous))}
    </Button>
  )
}
