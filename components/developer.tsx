"use client"

import { useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { proxyImage } from "@/lib/image-proxy"
import { getAvatarUrl, getDeveloperHref, type Mod } from "@/lib/mods"
import { useT } from "@/lib/use-lang"

const AVATAR_SIZES = {
  sm: "h-5 w-5 text-[10px]",
  md: "h-6 w-6 text-xs",
  lg: "h-20 w-20 text-3xl",
}

// The stored avatar first, then the current one from Discord (/api/avatar), then the initial. The stored
// avatar hash is from when the mod was posted and stops loading once the developer changes their avatar.
export function DeveloperAvatar({ mod, size = "sm" }: { mod: Mod; size?: keyof typeof AVATAR_SIZES }) {
  const sources = useMemo(() => {
    const stored = getAvatarUrl(mod)
    return [stored && proxyImage(stored), mod.user && `/api/avatar/${mod.user}`].filter((src): src is string => !!src)
  }, [mod])
  const [failedSources, setFailedSources] = useState<string[]>([])
  const src = sources.find((candidate) => !failedSources.includes(candidate))
  const fail = useCallback(() => src && setFailedSources((failed) => [...failed, src]), [src])
  // An image that already failed before hydration doesn't fire onError again
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0 && img.currentSrc) fail()
  }, [fail])
  const name = mod.cachedUsername || "?"
  const sizeClass = AVATAR_SIZES[size]

  if (!src) {
    return (
      <span
        aria-hidden
        className={`${sizeClass} inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground`}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      key={src}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${sizeClass} shrink-0 rounded-full border border-border object-cover bg-muted`}
      ref={ref}
      onError={fail}
    />
  )
}

export function DeveloperLink({ mod, className }: { mod: Mod; className?: string }) {
  const { t } = useT()
  const href = getDeveloperHref(mod)
  if (!href) return <span className={className}>{mod.cachedUsername}</span>
  return (
    <Link href={href} className={`hover:text-primary hover:underline ${className ?? ""}`}>
      {mod.cachedUsername || t("common.unknownDeveloper")}
    </Link>
  )
}
