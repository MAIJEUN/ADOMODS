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

// Letters and digits only, so two lines that differ only in emoji, punctuation or Markdown compare equal
const lineKey = (line: string) => line.replace(/<a?:\w+:\d+>/g, "").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase()

// Where a description gave a sentence in two languages, both copies can come back as the same sentence;
// keep the first. Lines in code blocks are left alone.
export function dropRepeatedLines(text: string) {
  const out: string[] = []
  let inCode = false
  let previousKey = ""
  for (const line of text.split("\n")) {
    if (line.trimStart().startsWith("```")) inCode = !inCode
    const key = inCode ? "" : lineKey(line)
    if (key && key === previousKey) continue
    out.push(line)
    if (key) previousKey = key
    else if (line.trim()) previousKey = ""
  }
  return out.join("\n")
}

// Lines of the reply that still read as another language: long enough to tell, and almost nothing in the
// target language's script. (Names alone rarely fill a line long enough to count.)
export function countUntranslatedLines(text: string, lang: Lang) {
  let inCode = false
  let count = 0
  for (const line of text.split("\n")) {
    if (line.trimStart().startsWith("```")) inCode = !inCode
    if (inCode) continue
    const share = scriptShare(line, lang)
    if (share !== null && share < 0.2) count++
  }
  return count
}
