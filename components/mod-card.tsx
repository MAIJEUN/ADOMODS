"use client"

import { memo, useCallback, useMemo, useState, type ReactElement, type ReactNode } from "react"
import Link from "next/link"
import useSWR from "swr"
import ReactMarkdown, { type Components } from "react-markdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, ExternalLink, Info, Calendar, Hash, MessageSquare } from "lucide-react"
import { proxyImage, safeExternalUrl } from "@/lib/image-proxy"
import { discordRemarkPlugins, preprocessDiscordMarkdown } from "@/lib/discord-markdown"
import { formatDate, getAvatarUrl, getDeveloperHref, getDiscordMessageUrl, normalizeMods, type Mod } from "@/lib/mods"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch mods")
  return res.json()
}

// `initialMods` comes from the server render; when present the client doesn't refetch on mount
export function useMods(initialMods?: Mod[]) {
  const hasInitial = !!initialMods && initialMods.length > 0
  const { data, error, isLoading } = useSWR("/api/mods", fetcher, {
    revalidateOnFocus: false,
    fallbackData: hasInitial ? initialMods : undefined,
    revalidateOnMount: !hasInitial,
  })
  // Memoized so the fallback [] doesn't create a new array (and re-run every memo downstream) on each render
  const mods = useMemo(() => normalizeMods(data), [data])
  return { mods, error: error as Error | undefined, isLoading }
}

function ImageWithFallback({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <span className="block text-sm text-muted-foreground">이미지를 불러올 수 없습니다.</span>
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

  if (revealed) return <span className="rounded bg-muted px-0.5">{children}</span>

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label="스포일러 보기"
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

const renderEmoji = (src: unknown, alt?: string) => (
  <img
    src={proxyImage(typeof src === "string" ? src : undefined)}
    alt={alt}
    title={alt}
    loading="lazy"
    className="inline-block h-[1.375em] w-auto align-text-bottom"
  />
)

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
        alt={alt || "이미지"}
        className="max-w-full h-auto rounded-lg border border-border shadow-sm"
      />
    ),
}

// Parsed card previews survive remounts (e.g. coming back from a developer page)
const previewCache = new Map<string, ReactElement>()
const PREVIEW_MAX_LINES = 8
const PREVIEW_MAX_CHARS = 400

function DescriptionPreview({ description }: { description: string }) {
  let preview = previewCache.get(description)
  if (preview === undefined) {
    // Only two lines are visible, so don't parse the whole description
    let source = description.split("\n", PREVIEW_MAX_LINES).join("\n")
    if (source.length > PREVIEW_MAX_CHARS) source = source.slice(0, PREVIEW_MAX_CHARS)
    preview = (
      <ReactMarkdown components={previewMarkdownComponents} remarkPlugins={discordRemarkPlugins}>
        {preprocessDiscordMarkdown(source)}
      </ReactMarkdown>
    )
    previewCache.set(description, preview)
  }
  return preview
}

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

export function DeveloperLink({ mod, className, onClick }: { mod: Mod; className?: string; onClick?: () => void }) {
  const href = getDeveloperHref(mod)
  if (!href) return <span className={className}>{mod.cachedUsername}</span>
  return (
    <Link href={href} className={`hover:text-primary hover:underline ${className ?? ""}`} onClick={onClick}>
      {mod.cachedUsername || "알 수 없는 개발자"}
    </Link>
  )
}

// Memoized: opening the detail dialog or typing in search must not re-parse every card's markdown
export const ModCard = memo(function ModCard({
  mod,
  onOpen,
  showDeveloper = true,
  eager = false,
}: {
  mod: Mod
  onOpen: (mod: Mod) => void
  showDeveloper?: boolean
  // Above-the-fold cards load their thumbnail immediately
  eager?: boolean
}) {
  const downloadUrl = safeExternalUrl(mod.download)

  // content-visibility lets the browser skip style/layout for off-screen cards (opening a dialog restyles the page)
  return (
    <Card className="group hover:border-primary/50 transition-all duration-200 overflow-hidden flex flex-col [content-visibility:auto] [contain-intrinsic-size:auto_420px]">
      {mod.thumbnail && (
        <div className="aspect-video w-full bg-muted relative overflow-hidden">
          <img
            src={proxyImage(mod.thumbnail)}
            alt={mod.name}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            decoding="async"
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-1">{mod.name}</CardTitle>
          {mod.category && (
            <Badge variant="outline" className="shrink-0">
              {mod.category}
            </Badge>
          )}
        </div>
        {mod.description && (
          <CardDescription className="line-clamp-2">
            <DescriptionPreview description={mod.description} />
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex-1 space-y-2 text-sm">
          {showDeveloper && mod.cachedUsername && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DeveloperAvatar mod={mod} />
              <DeveloperLink mod={mod} className="text-foreground font-medium truncate" />
            </div>
          )}
          {mod.version && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span>버전: {mod.version}</span>
            </div>
          )}
          {mod.uploadedTimestamp && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(mod.uploadedTimestamp)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {downloadUrl && (
            <Button className="flex-1" asChild>
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" />
                다운로드
              </a>
            </Button>
          )}

          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => onOpen(mod)}>
            <Info className="mr-2 h-4 w-4" />
            자세히
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})

function ModDetailContent({ mod, onClose }: { mod: Mod; onClose: () => void }) {
  const discordUrl = getDiscordMessageUrl(mod)
  const downloadUrl = safeExternalUrl(mod.download)
  const description = useMemo(
    () => (mod.description ? preprocessDiscordMarkdown(mod.description) : ""),
    [mod.description],
  )

  return (
    <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle className="text-2xl">{mod.name}</DialogTitle>
        <DialogDescription>모드 상세 정보</DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="max-w-none [&>*]:break-words">
          {description && (
            <>
              <h2 className="text-xl font-bold mt-3 mb-2">설명</h2>
              <ReactMarkdown components={detailMarkdownComponents} remarkPlugins={discordRemarkPlugins}>
                {description}
              </ReactMarkdown>
            </>
          )}

          <h2 className="text-xl font-bold mt-3 mb-2">기본 정보</h2>
          <ul className="list-disc pl-5 mb-2 space-y-1">
            {mod.cachedUsername && (
              <li>
                <strong>제작자:</strong>{" "}
                <span className="inline-flex items-center gap-1.5 align-middle">
                  <DeveloperAvatar mod={mod} size="md" />
                  <DeveloperLink mod={mod} className="text-primary" onClick={onClose} />
                </span>
              </li>
            )}
            {mod.version && (
              <li>
                <strong>버전:</strong> {mod.version}
              </li>
            )}
            {mod.uploadedTimestamp && (
              <li>
                <strong>업로드 날짜:</strong> {formatDate(mod.uploadedTimestamp)}
              </li>
            )}
          </ul>

          {mod.imageURL && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-lg font-semibold mb-3">📷 참고 이미지</h3>
              <div className="relative w-full">
                <ImageWithFallback
                  src={mod.imageURL}
                  alt={`${mod.name} 참고 이미지`}
                  className="max-w-full h-auto rounded-lg border border-border shadow-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
        {discordUrl && (
          <Button variant="outline" asChild>
            <a href={discordUrl} target="_blank" rel="noopener noreferrer">
              <MessageSquare className="mr-2 h-4 w-4" />
              디스코드 메시지로 이동
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        )}
        {downloadUrl && (
          <Button asChild>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              다운로드
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  )
}

// One shared detail dialog per page. `openMod` is stable so memoized cards don't re-render.
export function useModDialog() {
  const [mod, setMod] = useState<Mod | null>(null)
  const [open, setOpen] = useState(false)

  const openMod = useCallback((next: Mod) => {
    setMod(next)
    setOpen(true)
  }, [])
  const close = useCallback(() => setOpen(false), [])

  // The mod is kept after closing so the content stays rendered during the close animation
  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      {mod && <ModDetailContent mod={mod} onClose={close} />}
    </Dialog>
  )

  return { openMod, dialog }
}
