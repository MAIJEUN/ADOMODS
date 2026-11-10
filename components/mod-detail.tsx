"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, ChevronRight, ExternalLink, Github, Link2, Loader2, MessageSquare } from "lucide-react"
import { stripDiscordEmoji } from "@/lib/discord-markdown"
import { findModByKey, formatDate, getDiscordMessageUrl, getDownloadUrl, getModHref, type Mod } from "@/lib/mods"
import { getSourceRepos, type SourceRepo } from "@/lib/source-repo"
import { useT } from "@/lib/use-lang"
import { DownloadButton } from "@/components/download-button"
import { DeveloperAvatar, DeveloperLink } from "@/components/developer"
import { DiscordText, ImageWithFallback, ModDescription } from "@/components/mod-markdown"
import { FavoriteButton } from "@/components/mod-card"
import { OlderVersionNotice, useModVersion, VersionPicker, type ModVersionState } from "@/components/mod-version"
import { TranslateButton, TranslationNotice, useDescriptionTranslation } from "@/components/mod-translate"

// Main column: what the mod is (description and reference image)
function ModDetailMain({ mod, versionState }: { mod: Mod; versionState: ModVersionState }) {
  const { t } = useT()
  const translation = useDescriptionTranslation(mod)

  return (
    <div className={`max-w-none [&>*]:break-words ${versionState.loading ? "opacity-60" : ""}`}>
      {mod.description && (
        <>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              {t("detail.description")}
              {/* Makes clear the text below belongs to the older version picked in the sidebar */}
              {!versionState.isLatest && <Badge variant="outline">v{mod.version}</Badge>}
            </h2>
            <TranslateButton translation={translation} />
          </div>
          <TranslationNotice translation={translation} />
          <div className={translation.loading ? "opacity-60" : undefined}>
            <ModDescription description={translation.text ?? mod.description} />
          </div>
        </>
      )}

      {mod.imageURL && (
        <div className="mt-6">
          <ImageWithFallback
            src={mod.imageURL}
            alt={stripDiscordEmoji(mod.name)}
            fallbackHref={getDiscordMessageUrl(mod)}
            className="h-auto max-w-full rounded-lg border border-border shadow-sm"
          />
        </div>
      )}
    </div>
  )
}

function CopyLinkButton({ mod, className }: { mod: Mod; className?: string }) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      variant="outline"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}${getModHref(mod)}`)
          setCopied(true)
        } catch {
          // Clipboard blocked; nothing else to do
        }
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? t("detail.copied") : t("detail.copyLink")}
    </Button>
  )
}

function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

function ExternalRow({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      <ExternalLink aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
    </a>
  )
}

// Sidebar, top: download and version
function ModDetailActions({ mod, versionState }: { mod: Mod; versionState: ModVersionState }) {
  const { t } = useT()
  const hasHistory = versionState.versions.length > 1

  return (
    <div className="space-y-6">
      <DownloadButton
        url={getDownloadUrl(mod) ?? undefined}
        version={versionState.isLatest ? undefined : mod.version}
        size="lg"
        className="w-full"
        label={mod.version ? t("detail.downloadVersion", { v: mod.version }) : undefined}
      />

      <SidebarSection title={t("detail.versionTitle")}>
        {hasHistory ? (
          <>
            <VersionPicker state={versionState} className="w-full" />
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {versionState.loading && <Loader2 aria-hidden className="h-3 w-3 animate-spin" />}
              {t("detail.versionCount", { n: versionState.versions.length })}
            </p>
            <OlderVersionNotice state={versionState} />
          </>
        ) : (
          <p className="text-sm font-medium">{mod.version ?? t("common.unknownDate")}</p>
        )}
      </SidebarSection>
    </div>
  )
}

// One repository opens directly; several open a picker, since descriptions often link more than the
// mod's own (dependencies, related mods)
function SourceLink({ repos }: { repos: SourceRepo[] }) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const icon = <Github className="h-4 w-4" />
  if (repos.length === 1) return <ExternalRow href={repos[0].url} icon={icon} label={t("detail.source")} />

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
      >
        {icon}
        <span className="flex-1 truncate">{t("detail.source")}</span>
        <span className="rounded bg-muted px-1.5 text-xs text-muted-foreground">{repos.length}</span>
        <ChevronRight aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("detail.sourcePick")}</DialogTitle>
            <DialogDescription>{t("detail.sourcePickHint")}</DialogDescription>
          </DialogHeader>
          <ul className="-mx-2 flex-1 space-y-1 overflow-y-auto">
            {repos.map((repo) => (
              <li key={repo.url}>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
                >
                  <Github aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{repo.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{repo.host}</span>
                  </span>
                  {repo.fromDownload && <Badge variant="secondary">{t("detail.sourceFromDownload")}</Badge>}
                  <ExternalLink aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Sidebar, below: info, links, favorite and share
function ModDetailMeta({ latestMod, mod }: { latestMod: Mod; mod: Mod }) {
  const { t, locale } = useT()
  const discordUrl = getDiscordMessageUrl(mod)
  const sourceRepos = getSourceRepos(mod)

  return (
    <div className="space-y-6">

      <SidebarSection title={t("detail.info")}>
        <dl className="space-y-2 text-sm">
          {latestMod.cachedUsername && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{t("detail.author")}</dt>
              <dd className="flex min-w-0 items-center gap-1.5">
                <DeveloperAvatar mod={latestMod} />
                <DeveloperLink mod={latestMod} className="truncate font-medium" />
              </dd>
            </div>
          )}
          {mod.uploadedTimestamp && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{t("detail.uploaded")}</dt>
              <dd>{formatDate(mod.uploadedTimestamp, locale)}</dd>
            </div>
          )}
          {latestMod.category && (
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{t("detail.category")}</dt>
              <dd>
                <Badge variant="outline">{latestMod.category}</Badge>
              </dd>
            </div>
          )}
        </dl>
      </SidebarSection>

      {(sourceRepos.length > 0 || discordUrl) && (
        <SidebarSection title={t("detail.links")}>
          <div className="-mx-2">
            {sourceRepos.length > 0 && <SourceLink repos={sourceRepos} />}
            {discordUrl && (
              <ExternalRow href={discordUrl} icon={<MessageSquare className="h-4 w-4" />} label={t("detail.discord")} />
            )}
          </div>
        </SidebarSection>
      )}

      <div className="flex gap-2">
        <FavoriteButton mod={latestMod} showLabel className="flex-1" />
        <CopyLinkButton mod={latestMod} className="flex-1" />
      </div>
    </div>
  )
}

// Description on the left, sidebar on the right. On narrow screens it's one column: download and version,
// then the description, then the rest of the sidebar (the sidebar is display: contents there, so its two
// parts can sit on either side of the description).
// - "dialog": fills the dialog and each column scrolls on its own, so the sidebar stays put
// - "page": the full-width /mods/[id] page; the sidebar is its own panel that sticks below the header
export function ModDetailView({ mod, variant }: { mod: Mod; variant: "dialog" | "page" }) {
  const versionState = useModVersion(mod)
  const shown = versionState.shown
  const actions = <ModDetailActions mod={shown} versionState={versionState} />
  const meta = <ModDetailMeta latestMod={mod} mod={shown} />
  const main = <ModDetailMain mod={shown} versionState={versionState} />

  if (variant === "page") {
    const panel = "rounded-xl border border-border bg-card p-5 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0"
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <aside className="contents lg:sticky lg:top-32 lg:order-2 lg:block lg:space-y-6 lg:self-start lg:rounded-xl lg:border lg:border-border lg:bg-card lg:p-5">
          <div className={`order-1 ${panel}`}>{actions}</div>
          <div className={`order-3 ${panel}`}>{meta}</div>
        </aside>
        <div className="order-2 min-w-0 lg:order-1">{main}</div>
      </div>
    )
  }

  const section = "bg-muted/20 p-5 md:bg-transparent md:p-0"
  return (
    <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_18rem] md:grid-rows-[minmax(0,1fr)] md:overflow-hidden">
      <aside className="contents md:order-2 md:block md:space-y-6 md:overflow-y-auto md:border-l md:border-border md:bg-muted/20 md:p-5">
        <div className={`order-1 border-b border-border md:border-0 ${section}`}>{actions}</div>
        <div className={`order-3 border-t border-border md:border-0 ${section}`}>{meta}</div>
      </aside>
      <div className="order-2 p-6 md:order-1 md:overflow-y-auto">{main}</div>
    </div>
  )
}

function ModDetailDialogContent({ mod }: { mod: Mod }) {
  const { t } = useT()

  return (
    <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
      <DialogHeader className="flex-shrink-0 border-b border-border px-6 py-4 pr-12 text-left">
        <DialogTitle className="text-2xl">
          <DiscordText text={mod.name} />
        </DialogTitle>
        <DialogDescription className="sr-only">{t("detail.subtitle")}</DialogDescription>
      </DialogHeader>
      <ModDetailView mod={mod} variant="dialog" />
    </DialogContent>
  )
}

const MOD_PATH = /^\/mods\/([^/]+)\/?$/

const decodeSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

// One shared detail dialog per page, driven by the URL: opening a mod pushes /mods/[id] (so it can be
// shared and the back button closes it) without leaving the current page. `openMod` is stable so
// memoized cards don't re-render.
export function useModDialog(mods: Mod[]) {
  const pathname = usePathname()
  const match = MOD_PATH.exec(pathname)
  const openId = match ? decodeSegment(match[1]) : null
  const current = useMemo(
    () => (openId ? (findModByKey(mods, openId) ?? null) : null),
    [openId, mods],
  )

  // Keep showing the last mod while the dialog plays its close animation
  const [shown, setShown] = useState<Mod | null>(null)
  if (current && current !== shown) setShown(current)

  const openMod = useCallback((mod: Mod) => {
    // Next.js picks up history.pushState, so usePathname() updates without a navigation
    window.history.pushState(null, "", getModHref(mod))
  }, [])

  // Only reachable through openMod's pushState, so the previous entry is the page underneath
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) window.history.back()
  }, [])

  const dialog = (
    <Dialog open={current !== null} onOpenChange={handleOpenChange}>
      {shown && <ModDetailDialogContent mod={shown} />}
    </Dialog>
  )

  return { openMod, dialog }
}
