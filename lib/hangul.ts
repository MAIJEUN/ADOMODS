const CHOSUNG = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"
const SYLLABLE_START = 0xac00
const SYLLABLE_END = 0xd7a3
// Each initial consonant covers 21 vowels x 28 finals
const SYLLABLES_PER_CHOSUNG = 588

// "키 뷰어" -> "ㅋ ㅂㅇ"; other characters are kept as-is
export const toChosung = (text: string) =>
  Array.from(text, (char) => {
    const code = char.charCodeAt(0)
    if (code < SYLLABLE_START || code > SYLLABLE_END) return char
    return CHOSUNG[Math.floor((code - SYLLABLE_START) / SYLLABLES_PER_CHOSUNG)]
  }).join("")

// A query typed only with initial consonants, e.g. "ㅋㅂㅇ"
export const isChosungQuery = (query: string) => /^[ㄱ-ㅎ\s]+$/.test(query) && /[ㄱ-ㅎ]/.test(query)

// Search key for consonant queries: initials with whitespace removed
export const toChosungKey = (text: string) => toChosung(text).replace(/\s+/g, "")

// Matches normally, or by initial consonants when the query is all consonants
// (chosungHaystack comes from toChosungKey)
export const matchesQuery = (haystack: string, chosungHaystack: string, query: string) =>
  isChosungQuery(query) ? chosungHaystack.includes(query.replace(/\s+/g, "")) : haystack.includes(query)
