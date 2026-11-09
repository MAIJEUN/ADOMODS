import type { Lang } from "@/lib/i18n"

const HANGUL = /[\uac00-\ud7a3]/g
const KANA = /[\u3040-\u30ff]/g
const HAN = /[\u4e00-\u9fff]/g
const LATIN = /[a-z\u00c0-\u024f]/gi
const WORD = /[a-z\u00c0-\u024f']+/gi

// Short words that are frequent in one language and rare in the other, to tell French from English
const FRENCH_WORDS = new Set(
  "le la les un une des du de au aux et est sont pour dans avec sur par pas que qui ce cette ces ne vous nous il elle ou mais plus être été très".split(" "),
)
const ENGLISH_WORDS = new Set(
  "the a an and is are for in with on by not that which this these you we it or but more be been very of to".split(" "),
)
const FRENCH_ACCENTS = /[àâçéèêëîïôûùüÿœ]/gi

// How the Latin letters of a text split between French and English: the share that reads as French,
// or null when nothing tells (only names and code-like words)
function frenchShareOfLatin(text: string) {
  let fr = (text.match(FRENCH_ACCENTS)?.length ?? 0) / 2
  let en = 0
  for (const word of text.toLowerCase().match(WORD) ?? []) {
    if (FRENCH_WORDS.has(word)) fr++
    else if (ENGLISH_WORDS.has(word)) en++
  }
  return fr + en === 0 ? null : fr / (fr + en)
}

// How much of the text is written in the language, from 0 to 1; null when there's too little text to
// tell. Code, links, emoji and mentions don't count. Hangul, kana and Han characters count double: one
// carries about as much as a short Latin word. Japanese and Chinese share Han characters, which count as
// Japanese when the text also has kana. French and English share the alphabet, so their letters are split
// by frequent words and accents; Latin letters with neither are names (mods, tools, people) and don't
// count for any language.
export function scriptShare(text: string, lang: Lang): number | null {
  const plain = text
    .replace(/```[\s\S]*?```|`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+|<a?:\w+:\d+>|<[@#][!&]?\d+>/g, " ")
  const count = (re: RegExp) => plain.match(re)?.length ?? 0
  const ko = count(HANGUL) * 2
  const kana = count(KANA) * 2
  const han = count(HAN) * 2
  const frShare = frenchShareOfLatin(plain)
  const latin = frShare === null ? 0 : count(LATIN)
  const total = ko + kana + han + latin
  if (total < 20) return null

  // Kana is a small part of most Japanese text, but Chinese has none
  const ja = kana > 0 && kana >= han * 0.1 ? kana + han : kana
  const zh = ja > kana ? 0 : han
  const fr = latin * (frShare ?? 0)
  const en = latin - fr

  const amount: Record<Lang, number> = { ko, ja, zh, fr, en }
  return amount[lang] / total
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
