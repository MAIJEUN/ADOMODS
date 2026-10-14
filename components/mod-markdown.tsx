"use client"

import { useState, type ReactElement, type ReactNode } from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import { proxyImage } from "@/lib/image-proxy"
import {
  DISCORD_EMOJI,
  discordEmojiUrl,
  getDiscordRemarkPlugins,
  preprocessDiscordMarkdown,
} from "@/lib/discord-markdown"
import { useT } from "@/lib/use-lang"

export function ImageWithFallback({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const { t } = useT()

  if (failed) {
    return <span className="block text-sm text-muted-foreground">{t("detail.imageError")}</span>
  }

  return (
    <img
      src={proxyImage(src)}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  )
}

function Spoiler({ children }: { children?: ReactNode }) {
  const [revealed, setRevealed] = useState(false)
  const { t } = useT()

  if (revealed) return <span className="rounded bg-muted px-0.5">{children}</span>

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={t("md.spoiler")}
      className="cursor-pointer select-none rounded bg-muted-foreground px-0.5 text-transparent [&_*]:invisible"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setRevealed(true)
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          setRevealed(true)
        }
      }}
    >
      {children}
    </span>
  )
}

// Discord-only elements produced by lib/discord-markdown
const discordComponents: Components = {
  span: ({ node, className, children, ...props }) =>
    className?.includes("discord-spoiler") ? (
      <Spoiler>{children}</Spoiler>
    ) : (
      <span className={className} {...props}>
        {children}
      </span>
    ),
  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-border pl-3 my-1" {...props} />,
  hr: () => <hr className="my-3 border-border" />,
}

// Custom Discord emoji; shows :name: as text if the image can't be loaded (deleted emoji, bad ID)
function DiscordEmoji({ src, name }: { src?: string; name?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) return <span className="text-muted-foreground">{name}</span>
  return (
    <img
      src={proxyImage(src)}
      alt={name}
      title={name}
      loading="lazy"
      decoding="async"
      className="inline-block h-[1.2em] w-auto align-[-0.2em]"
      onError={() => setFailed(true)}
    />
  )
}

const renderEmoji = (src: unknown, alt?: string) => (
  <DiscordEmoji src={typeof src === "string" ? src : undefined} name={alt} />
)

// Plain text (e.g. a mod name) with Discord custom emoji rendered as images
export function DiscordText({ text }: { text: string }) {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(DISCORD_EMOJI)) {
    const [raw, animated, name, id] = match
    const index = match.index ?? 0
    if (index > last) parts.push(text.slice(last, index))
    parts.push(<DiscordEmoji key={index} src={discordEmojiUrl(id, !!animated)} name={`:${name}:`} />)
    last = index + raw.length
  }
  if (last === 0) return <>{text}</>
  parts.push(text.slice(last))
  return <>{parts}</>
}

// Compact rendering for the card preview (inside a 2-line clamp); blocks become inline spans
const previewMarkdownComponents: Components = {
  ...discordComponents,
  p: ({ node, ...props }) => (
    <>
      <span {...props} />{" "}
    </>
  ),
  h1: ({ node, ...props }) => (
    <>
      <span className="font-semibold" {...props} />{" "}
    </>
  ),
  h2: ({ node, ...props }) => (
    <>
      <span className="font-semibold" {...props} />{" "}
    </>
  ),
  h3: ({ node, ...props }) => (
    <>
      <span className="font-semibold" {...props} />{" "}
    </>
  ),
  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
  em: ({ node, ...props }) => <em {...props} />,
  code: ({ node, ...props }) => <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props} />,
  // Images would break the line clamp; they are shown in the detail dialog instead (custom emoji stay)
  img: ({ node, className, src, alt }) => (className?.includes("discord-emoji") ? renderEmoji(src, alt) : null),
}

const detailMarkdownComponents: Components = {
  ...discordComponents,
  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-3 mb-1" {...props} />,
  p: ({ node, ...props }) => <p className="mb-2 break-words" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-2 space-y-1" {...props} />,
  li: ({ node, ...props }) => <li className="break-words" {...props} />,
  // react-markdown v10 has no `inline` prop: block code is wrapped in <pre>, so style <pre> and
  // reset the inline <code> styles inside it
  pre: ({ node, ...props }) => (
    <pre
      className="bg-muted p-2 rounded text-sm overflow-x-auto mb-2 [&>code]:bg-transparent [&>code]:p-0 [&>code]:break-normal"
      {...props}
    />
  ),
  code: ({ node, ...props }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm break-all" {...props} />,
  a: ({ node, ...props }) => (
    <a className="text-primary hover:underline break-all" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  img: ({ node, className, src, alt }) =>
    className?.includes("discord-emoji") ? (
      renderEmoji(src, alt)
    ) : (
      <ImageWithFallback
        src={typeof src === "string" ? src : undefined}
        alt={alt || ""}
        className="max-w-full h-auto rounded-lg border border-border shadow-sm"
      />
    ),
}

// Parsed card previews survive remounts (e.g. coming back from a developer page); keyed by language too
const previewCache = new Map<string, ReactElement>()
const PREVIEW_MAX_LINES = 8
const PREVIEW_MAX_CHARS = 400

export function DescriptionPreview({ description }: { description: string }) {
  const { lang } = useT()
  const cacheKey = `${lang}\n${description}`
  let preview = previewCache.get(cacheKey)
  if (preview === undefined) {
    // Only two lines are visible, so don't parse the whole description
    let source = description.split("\n", PREVIEW_MAX_LINES).join("\n")
    if (source.length > PREVIEW_MAX_CHARS) source = source.slice(0, PREVIEW_MAX_CHARS)
    preview = (
      <ReactMarkdown components={previewMarkdownComponents} remarkPlugins={getDiscordRemarkPlugins(lang)}>
        {preprocessDiscordMarkdown(source)}
      </ReactMarkdown>
    )
    previewCache.set(cacheKey, preview)
  }
  return preview
}

// Full description for the detail view
export function ModDescription({ description }: { description: string }) {
  const { lang } = useT()
  return (
    <ReactMarkdown components={detailMarkdownComponents} remarkPlugins={getDiscordRemarkPlugins(lang)}>
      {preprocessDiscordMarkdown(description)}
    </ReactMarkdown>
  )
}
