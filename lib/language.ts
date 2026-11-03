import type { Lang } from "@/lib/i18n"

const SCRIPT: Record<Lang, RegExp> = {
  ko: /[가-힣]/g,
  zh: /[一-鿿]/g,
  en: /[a-z]/gi,
}

// How much of the text is written in the language's script, from 0 to 1; null when there's too little
// text to tell. Code, links, emoji and mentions don't count. Hangul and Han characters count double:
// one carries about as much as a short Latin word.
export function scriptShare(text: string, lang: Lang): number | null {
  const plain = text
    .replace(/```[\s\S]*?```|`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+|<a?:\w+:\d+>|<[@#][!&]?\d+>/g, " ")
  const count = (re: RegExp) => (plain.match(re)?.length ?? 0) * (re === SCRIPT.en ? 1 : 2)
  const total = count(SCRIPT.ko) + count(SCRIPT.zh) + count(SCRIPT.en)
  return total < 20 ? null : count(SCRIPT[lang]) / total
}

// Whether a good part of the text is in another language than the reader's
export function needsTranslation(text: string, lang: Lang) {
  const share = scriptShare(text, lang)
  return share !== null && share < 0.7
}
