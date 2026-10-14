"use client"

import { useState } from "react"
import Link from "next/link"
import { proxyImage } from "@/lib/image-proxy"
import { getAvatarUrl, getDeveloperHref, type Mod } from "@/lib/mods"
import { useT } from "@/lib/use-lang"

const AVATAR_SIZES = {
  sm: "h-5 w-5 text-[10px]",
  md: "h-6 w-6 text-xs",
  lg: "h-20 w-20 text-3xl",
}

export function DeveloperAvatar({ mod, size = "sm" }: { mod: Mod; size?: keyof typeof AVATAR_SIZES }) {
  const [failed, setFailed] = useState(false)
  const src = getAvatarUrl(mod)
  const name = mod.cachedUsername || "?"
  const sizeClass = AVATAR_SIZES[size]

  if (!src || failed) {
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
      src={proxyImage(src)}
      alt=""
      loading="lazy"
      decoding="async"
      className={`${sizeClass} shrink-0 rounded-full border border-border object-cover bg-muted`}
      onError={() => setFailed(true)}
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
