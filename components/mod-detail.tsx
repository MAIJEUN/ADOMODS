"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, ExternalLink, Github, Link2, Loader2, MessageSquare } from "lucide-react"
import { stripDiscordEmoji } from "@/lib/discord-markdown"
import { formatDate, getDiscordMessageUrl, getDownloadUrl, getModHref, getModId, type Mod } from "@/lib/mods"
import { getSourceRepoUrl } from "@/lib/source-repo"
import { useT } from "@/lib/use-lang"
import { DownloadButton } from "@/components/download-button"
import { DeveloperAvatar, DeveloperLink } from "@/components/developer"
import { DiscordText, ImageWithFallback, ModDescription } from "@/components/mod-markdown"
import { FavoriteButton } from "@/components/mod-card"
import { OlderVersionNotice, useModVersion, VersionPicker, type ModVersionState } from "@/components/mod-version"

// Main column: what the mod is (description and reference image)
function ModDetailMain({ mod, versionState }: { mod: Mod; versionState: ModVersionState }) {
  const { t } = useT()

  return (
    <div className={`max-w-none [&>*]:break-words ${versionState.loading ? "opacity-60" : ""}`}>
      {mod.description && (
        <>
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold">
            {t("detail.description")}
            {/* Makes clear the text below belongs to the older version picked in the sidebar */}
            {!versionState.isLatest && <Badge variant="outline">v{mod.version}</Badge>}
          </h3>
          <ModDescription description={mod.description} />
        </>
      )}

      {mod.imageURL && (
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="mb-3 text-lg font-semibold">{t("detail.referenceImage")}</h3>
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
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
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

// Sidebar: everything you do with the mod (download, version, info, links)
function ModDetailSidebar({
  latestMod,
  mod,
  versionState,
}: {
  latestMod: Mod
  mod: Mod
  versionState: ModVersionState
}) {
  const { t, locale } = useT()
  const discordUrl = getDiscordMessageUrl(mod)
  const sourceUrl = getSourceRepoUrl(mod)
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

      {(sourceUrl || discordUrl) && (
        <SidebarSection title={t("detail.links")}>
          <div className="-mx-2">
            {sourceUrl && <ExternalRow href={sourceUrl} icon={<Github className="h-4 w-4" />} label={t("detail.source")} />}
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

// Description on the left, actions on the right; on phones the sidebar comes first so the download
// is right there. With `scrollColumns`, each column scrolls on its own (dialog), so the sidebar stays put.
export function ModDetailView({ mod, scrollColumns = false }: { mod: Mod; scrollColumns?: boolean }) {
  const versionState = useModVersion(mod)
  const shown = versionState.shown

  return (
    <div
      className={`grid md:grid-cols-[minmax(0,1fr)_18rem] ${scrollColumns ? "min-h-0 flex-1 overflow-y-auto md:grid-rows-[minmax(0,1fr)] md:overflow-hidden" : ""}`}
    >
      <aside
        className={`border-b border-border bg-muted/20 p-5 md:order-2 md:border-b-0 md:border-l ${scrollColumns ? "md:overflow-y-auto" : "md:rounded-br-xl"}`}
      >
        {/* On the full page the sidebar sticks below the site header while the description scrolls */}
        <div className={scrollColumns ? "" : "md:sticky md:top-32"}>
          <ModDetailSidebar latestMod={mod} mod={shown} versionState={versionState} />
        </div>
      </aside>
      <div className={`p-6 md:order-1 ${scrollColumns ? "md:overflow-y-auto" : ""}`}>
        <ModDetailMain mod={shown} versionState={versionState} />
      </div>
    </div>
  )
}

function ModDetailDialogContent({ mod }: { mod: Mod }) {
  const { t } = useT()

  return (
    <DialogContent className="flex h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
      <DialogHeader className="flex-shrink-0 border-b border-border px-6 py-4 pr-12 text-left">
        <DialogTitle className="text-2xl">
          <DiscordText text={mod.name} />
        </DialogTitle>
        <DialogDescription className="sr-only">{t("detail.subtitle")}</DialogDescription>
      </DialogHeader>
      <ModDetailView mod={mod} scrollColumns />
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
    () => (openId ? (mods.find((mod) => getModId(mod) === openId) ?? null) : null),
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
