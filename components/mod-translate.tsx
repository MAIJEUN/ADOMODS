"use client"

import { useState } from "react"
import useSWRImmutable from "swr/immutable"
import { Button } from "@/components/ui/button"
import { Languages, Loader2 } from "lucide-react"
import type { Lang } from "@/lib/i18n"
import type { Mod } from "@/lib/mods"
import { useT } from "@/lib/use-lang"

// Inlined at build time from whether ANTHROPIC_API_KEY is set (next.config.mjs)
const TRANSLATION_ENABLED = process.env.NEXT_PUBLIC_TRANSLATION_ENABLED === "1"

const SCRIPT: Record<Lang, RegExp> = {
  ko: /[가-힣]/g,
  zh: /[一-鿿]/g,
  en: /[a-z]/gi,
}

// Whether a good part of the text is in a script other than the reader's. Hangul and Han characters
// count double: one carries about as much as a short Latin word.
export function needsTranslation(text: string, lang: Lang) {
  const plain = text
    .replace(/```[\s\S]*?```|`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+|<a?:\w+:\d+>|<[@#][!&]?\d+>/g, " ")
  const count = (re: RegExp) => (plain.match(re)?.length ?? 0) * (re === SCRIPT.en ? 1 : 2)
  const total = count(SCRIPT.ko) + count(SCRIPT.zh) + count(SCRIPT.en)
  return total >= 20 && count(SCRIPT[lang]) / total < 0.7
}

const fetcher = async (url: string): Promise<string> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Translation failed (${res.status})`)
  return (await res.json()).text
}

export interface DescriptionTranslation {
  // Whether to offer a translation at all
  available: boolean
  // The translated text while the translation is switched on and loaded
  text: string | null
  active: boolean
  loading: boolean
  failed: boolean
  toggle: () => void
}

export function useDescriptionTranslation(mod: Mod): DescriptionTranslation {
  const { lang } = useT()
  const description = mod.description ?? ""
  const key = `/api/translate?${new URLSearchParams({ name: mod.name, version: mod.version ?? "", lang })}`
  // Switched on for one mod, version and language; picking another one shows its original text again
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const active = activeKey === key
  const available = TRANSLATION_ENABLED && !!description && needsTranslation(description, lang)

  const { data, error, isLoading } = useSWRImmutable(available && active ? key : null, fetcher, {
    shouldRetryOnError: false,
  })

  return {
    available,
    text: active ? (data ?? null) : null,
    active,
    loading: active && isLoading,
    failed: active && !!error,
    toggle: () => setActiveKey(active ? null : key),
  }
}

export function TranslateButton({ translation }: { translation: DescriptionTranslation }) {
  const { t } = useT()
  if (!translation.available) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className="ml-auto h-7 gap-1.5 px-2 text-xs font-normal text-muted-foreground"
      onClick={translation.toggle}
    >
      {translation.loading ? (
        <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Languages aria-hidden className="h-3.5 w-3.5" />
      )}
      {translation.active ? t("detail.showOriginal") : t("detail.translate")}
    </Button>
  )
}

// Shown above a translated description, or in place of it when translating failed
export function TranslationNotice({ translation }: { translation: DescriptionTranslation }) {
  const { t } = useT()
  if (translation.failed) {
    return (
      <p role="status" className="mb-3 text-xs text-destructive">
        {t("detail.translateError")}
      </p>
    )
  }
  if (!translation.text) return null
  return (
    <p role="status" className="mb-3 text-xs text-muted-foreground">
      {t("detail.translatedNotice")}
    </p>
  )
}
