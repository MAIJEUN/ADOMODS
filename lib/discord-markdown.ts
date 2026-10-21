import type { Options } from "react-markdown"
import { localeOf, translate, type Lang } from "@/lib/i18n"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

// Discord message markdown differs from CommonMark in a few ways. This module closes the gap:
// - single newlines are line breaks (remark-breaks)
// - ~~strike~~ and bare URL links (remark-gfm)
// - `-# subtext`, `__underline__`, `||spoiler||`, `>>> quote`, custom emoji, mentions and <t:...> timestamps

interface MdNode {
  type: string
  value?: string
  children?: MdNode[]
  position?: { start: { offset?: number } }
  data?: { hName?: string; hProperties?: Record<string, unknown> }
}

const QUOTE_LINE = /^ {0,3}>/
const FENCE_LINE = /^\s*```/

// Line-level fixes that must happen before parsing
export function preprocessDiscordMarkdown(text: string) {
  const out: string[] = []
  let inFence = false
  let quoteRest = false

  for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
    if (quoteRest) {
      // `>>>` quotes everything until the end of the message
      out.push(`> ${line}`)
      if (FENCE_LINE.test(line)) inFence = !inFence
      continue
    }
    if (FENCE_LINE.test(line)) {
      inFence = !inFence
      out.push(line)
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }

    const multiQuote = /^>>> ?(.*)$/.exec(line)
    if (multiQuote) {
      quoteRest = true
      out.push(`> ${multiQuote[1]}`)
      continue
    }

    const prev = out[out.length - 1]
    const prevHasText = prev !== undefined && prev.trim() !== ""

    // Discord quotes only cover their own line; CommonMark would pull the next line into the quote
    if (prevHasText && QUOTE_LINE.test(prev) && line.trim() !== "" && !QUOTE_LINE.test(line)) {
      out.push("")
    }
    // A line of only - or = under text would turn that text into a heading in CommonMark
    if (prevHasText && /^ {0,3}(-+|=+)\s*$/.test(line)) {
      out.push("")
    }
    // "[text]<https://...>)" (missing "(") is common in posts and Discord still shows a link
    const fixedLinks = line.replace(/\]<(https?:\/\/[^\s>]+)>\)/g, "](<$1>)")
    // Discord needs "> " with a space; ">_<" etc. are plain text
    out.push(/^>(?![ >])/.test(fixedLinks) ? `\\${fixedLinks}` : fixedLinks)
  }

  // An unclosed code block would swallow everything after the description
  if (inFence) out.push(quoteRest ? "> ```" : "```")

  return out.join("\n")
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
  ["second", 1],
]

const TIMESTAMP_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  t: { timeStyle: "short" },
  T: { timeStyle: "medium" },
  d: { dateStyle: "short" },
  D: { dateStyle: "long" },
  f: { dateStyle: "long", timeStyle: "short" },
  F: { dateStyle: "full", timeStyle: "short" },
}

const formatDiscordTimestamp = (lang: Lang, seconds: number, style = "f") => {
  const date = new Date(seconds * 1000)
  if (style === "R") {
    const diff = seconds - Date.now() / 1000
    const [unit, size] = RELATIVE_UNITS.find(([, s]) => Math.abs(diff) >= s) ?? RELATIVE_UNITS[RELATIVE_UNITS.length - 1]
    return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(Math.round(diff / size), unit)
  }
  return date.toLocaleString(localeOf(lang), TIMESTAMP_FORMATS[style] ?? TIMESTAMP_FORMATS.f)
}

// <:name:id> or <a:name:id> (animated)
export const DISCORD_EMOJI = /<(a?):(\w+):(\d+)>/g

export const discordEmojiUrl = (id: string, animated: boolean) =>
  `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "webp"}?size=48`

// For plain-text uses of a name (alt text, sorting, page titles)
export const stripDiscordEmoji = (text: string) => text.replace(DISCORD_EMOJI, "").replace(/\s{2,}/g, " ").trim()

const MENTION_CLASS = ["rounded", "bg-primary/15", "px-1", "font-medium", "text-primary"]

const element = (hName: string, hProperties: Record<string, unknown>, children: MdNode[] = []): MdNode => ({
  type: "discordElement",
  data: { hName, hProperties },
  children,
})

const INLINE_TOKEN = /\|\|(.+?)\|\||<(a?):(\w+):(\d+)>|<t:(-?\d+)(?::([tTdDfFR]))?>|<@!?(\d+)>|<@&(\d+)>|<#(\d+)>/g

function splitInline(value: string, lang: Lang): MdNode[] {
  const nodes: MdNode[] = []
  let last = 0
  for (const match of value.matchAll(INLINE_TOKEN)) {
    const [raw, spoiler, animated, emojiName, emojiId, ts, tsStyle, userId, roleId, channelId] = match
    const index = match.index ?? 0
    if (index > last) nodes.push({ type: "text", value: value.slice(last, index) })
    last = index + raw.length

    if (spoiler !== undefined) {
      nodes.push(element("span", { className: ["discord-spoiler"] }, [{ type: "text", value: spoiler }]))
    } else if (emojiId) {
      nodes.push(
        element("img", {
          className: ["discord-emoji"],
          src: discordEmojiUrl(emojiId, !!animated),
          alt: `:${emojiName}:`,
          title: `:${emojiName}:`,
        }),
      )
    } else if (ts) {
      const seconds = Number(ts)
      nodes.push(
        element("time", { className: ["rounded", "bg-muted", "px-1"], title: formatDiscordTimestamp(lang, seconds, "F") }, [
          { type: "text", value: formatDiscordTimestamp(lang, seconds, tsStyle) },
        ]),
      )
    } else {
      // IDs can't be resolved to names without the Discord API
      const label = userId
        ? translate(lang, "md.user")
        : roleId
          ? translate(lang, "md.role")
          : channelId
            ? translate(lang, "md.channel")
            : raw
      nodes.push(element("span", { className: MENTION_CLASS }, [{ type: "text", value: label }]))
    }
  }
  if (last === 0) return [{ type: "text", value }]
  if (last < value.length) nodes.push({ type: "text", value: value.slice(last) })
  return nodes
}

// Splits a paragraph at its line breaks so `-# ` lines become their own subtext blocks
function splitSubtext(paragraph: MdNode): MdNode[] {
  const lines: MdNode[][] = [[]]
  for (const child of paragraph.children ?? []) {
    if (child.type === "break") lines.push([])
    else lines[lines.length - 1].push(child)
  }

  const isSubtext = (line: MdNode[]) => line[0]?.type === "text" && /^-# /.test(line[0].value ?? "")
  if (!lines.some(isSubtext)) return [paragraph]

  const result: MdNode[] = []
  let plain: MdNode[][] = []
  const flushPlain = () => {
    if (plain.length === 0) return
    const children = plain.flatMap((line, i) => (i === 0 ? line : [{ type: "break" }, ...line]))
    result.push({ type: "paragraph", children })
    plain = []
  }

  for (const line of lines) {
    if (!isSubtext(line)) {
      plain.push(line)
      continue
    }
    flushPlain()
    const [first, ...rest] = line
    const stripped = (first.value ?? "").replace(/^-# +/, "")
    result.push({
      type: "paragraph",
      data: {
        hName: "small",
        hProperties: { className: ["discord-subtext", "block", "text-xs", "text-muted-foreground", "mb-1"] },
      },
      children: stripped ? [{ ...first, value: stripped }, ...rest] : rest,
    })
  }
  flushPlain()
  return result
}

function transform(node: MdNode, source: string, lang: Lang) {
  if (!node.children) return

  // CommonMark treats __text__ as bold; in Discord it is underline
  const offset = node.position?.start.offset
  if (node.type === "strong" && offset !== undefined && source.startsWith("__", offset)) {
    node.data = { ...node.data, hName: "u" }
  }

  node.children = node.children.flatMap((child) => {
    if (child.type === "paragraph") return splitSubtext(child)
    if (child.type === "text" && child.value) return splitInline(child.value, lang)
    return [child]
  })
  for (const child of node.children) transform(child, source, lang)
}

function remarkDiscord(options: { lang: Lang }) {
  return (tree: MdNode, file: { value?: unknown }) => {
    transform(tree, typeof file.value === "string" ? file.value : "", options.lang)
  }
}

const pluginsByLang = {} as Record<Lang, Options["remarkPlugins"]>

// Mention labels and timestamps are rendered in the given language
export const getDiscordRemarkPlugins = (lang: Lang) =>
  (pluginsByLang[lang] ??= [
    // Discord has no single-tilde strikethrough
    [remarkGfm, { singleTilde: false }],
    remarkBreaks,
    [remarkDiscord, { lang }],
  ])
