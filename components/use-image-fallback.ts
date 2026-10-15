"use client"

import { useCallback, useState } from "react"

// Tracks whether an <img> failed to load. onError alone misses images that already failed before
// hydration (server-rendered pages), so the ref also checks the image's state when React attaches.
export function useImageFallback() {
  const [failed, setFailed] = useState(false)
  const ref = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0 && img.currentSrc) setFailed(true)
  }, [])
  const onError = useCallback(() => setFailed(true), [])
  return { failed, ref, onError }
}
