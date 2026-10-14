"use client"

import { useCallback, useSyncExternalStore } from "react"
import { LANGS, localeOf, translate, type Lang, type TranslationKey } from "@/lib/i18n"

// Language lives in localStorage. Pages are rendered in Korean on the server and switch after hydration.
const STORAGE_KEY = "adomods-lang"
const listeners = new Set<() => void>()
let current: Lang | null = null

const readLang = (): Lang => {
  if (current) return current
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (LANGS.includes(stored as Lang)) return (current = stored as Lang)
  } catch {
    // Storage blocked; fall back to the browser language
  }
  const browser = navigator.language?.toLowerCase() ?? ""
  current = browser.startsWith("ko") ? "ko" : browser.startsWith("zh") ? "zh" : "en"
  return current
}

export const setLang = (lang: Lang) => {
  current = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // Not persisted; still applies for this page session
  }
  document.documentElement.lang = localeOf(lang)
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => "ko")
}

export function useT() {
  const lang = useLang()
  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang])
  return { t, lang, locale: localeOf(lang) }
}
