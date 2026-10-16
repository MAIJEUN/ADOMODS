"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Check, ExternalLink, Github, Link2, MessageSquare } from "lucide-react"
import { stripDiscordEmoji } from "@/lib/discord-markdown"
import { formatDate, getDiscordMessageUrl, getModHref, getModId, type Mod } from "@/lib/mods"
import { getSourceRepoUrl } from "@/lib/source-repo"
import { useT } from "@/lib/use-lang"
import { DownloadButton } from "@/components/download-button"
import { DeveloperAvatar, DeveloperLink } from "@/components/developer"
import { DiscordText, ImageWithFallback, ModDescription } from "@/components/mod-markdown"
import { FavoriteButton } from "@/components/mod-card"

// Description, info and reference image; shared by the dialog and the /mods/[id] page
export function ModDetailBody({ mod }: { mod: Mod }) {
  const { t, locale } = useT()

  return (
    <div className="max-w-none [&>*]:break-words">
      {mod.description && (
        <>
          <h2 className="text-xl font-bold mt-3 mb-2">{t("detail.description")}</h2>
          <ModDescription description={mod.description} />
        </>
      )}

      <h2 className="text-xl font-bold mt-3 mb-2">{t("detail.info")}</h2>
      <ul className="list-disc pl-5 mb-2 space-y-1">
        {mod.cachedUsername && (
          <li>
            <strong>{t("detail.author")}</strong>{" "}
            <span className="inline-flex items-center gap-1.5 align-middle">
              <DeveloperAvatar mod={mod} size="md" />
              <DeveloperLink mod={mod} className="text-primary" />
            </span>
          </li>
        )}
        {mod.version && (
          <li>
            <strong>{t("detail.version")}</strong> {mod.version}
          </li>
        )}
        {mod.uploadedTimestamp && (
          <li>
            <strong>{t("detail.uploaded")}</strong> {formatDate(mod.uploadedTimestamp, locale)}
          </li>
        )}
      </ul>

      {mod.imageURL && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-3">{t("detail.referenceImage")}</h3>
          <div className="relative w-full">
            <ImageWithFallback
              src={mod.imageURL}
              alt={stripDiscordEmoji(mod.name)}
              fallbackHref={getDiscordMessageUrl(mod)}
              className="max-w-full h-auto rounded-lg border border-border shadow-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function CopyLinkButton({ mod }: { mod: Mod }) {
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
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`${window.location.origin}${getModHref(mod)}`)
          setCopied(true)
        } catch {
          // Clipboard blocked; nothing else to do
        }
      }}
    >
      {copied ? <Check className="mr-2 h-4 w-4" /> : <Link2 className="mr-2 h-4 w-4" />}
      {copied ? t("detail.copied") : t("detail.copyLink")}
    </Button>
  )
}

export function ModDetailActions({ mod }: { mod: Mod }) {
  const { t } = useT()
  const discordUrl = getDiscordMessageUrl(mod)
  const sourceUrl = getSourceRepoUrl(mod)

  return (
    <>
      <FavoriteButton mod={mod} className="mr-auto" />
      <CopyLinkButton mod={mod} />
      {sourceUrl && (
        <Button variant="outline" asChild>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" title={sourceUrl}>
            <Github className="mr-2 h-4 w-4" />
            {t("detail.source")}
            <ExternalLink className="ml-2 h-3 w-3" />
          </a>
        </Button>
      )}
      {discordUrl && (
        <Button variant="outline" asChild>
          <a href={discordUrl} target="_blank" rel="noopener noreferrer">
            <MessageSquare className="mr-2 h-4 w-4" />
            {t("detail.discord")}
            <ExternalLink className="ml-2 h-3 w-3" />
          </a>
        </Button>
      )}
      <DownloadButton url={mod.download} external />
    </>
  )
}

function ModDetailDialogContent({ mod }: { mod: Mod }) {
  const { t } = useT()

  return (
    <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] flex flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle className="text-2xl">
          <DiscordText text={mod.name} />
        </DialogTitle>
        <DialogDescription>{t("detail.subtitle")}</DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto pr-2">
        <ModDetailBody mod={mod} />
      </div>

      <DialogFooter className="flex-shrink-0 flex flex-wrap justify-end gap-2 pt-4 border-t">
        <ModDetailActions mod={mod} />
      </DialogFooter>
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
