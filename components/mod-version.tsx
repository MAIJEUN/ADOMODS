"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { History, Loader2 } from "lucide-react"
import { getModVersions, type Mod, type ModVersion } from "@/lib/mods"
import { useT } from "@/lib/use-lang"

// Fields that differ between versions; everything else (name, author, IDs) comes from the latest entry
const VERSIONED_FIELDS = [
  "version",
  "description",
  "download",
  "parsedDownload",
  "uploadedTimestamp",
  "imageURL",
  "thumbnail",
] as const satisfies readonly (keyof Mod)[]

const fetcher = async (url: string): Promise<Mod> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load version (${res.status})`)
  return res.json()
}

export interface ModVersionState {
  versions: ModVersion[]
  selected: string | undefined
  select: (version: string) => void
  // True while showing the latest version (the mod entry itself)
  isLatest: boolean
  // The mod as it was in the selected version
  shown: Mod
  loading: boolean
  failed: boolean
}

export function useModVersion(mod: Mod): ModVersionState {
  const versions = useMemo(() => getModVersions(mod), [mod])
  const [selection, setSelection] = useState<{ mod: Mod; version: string } | null>(null)
  // A selection only applies to the mod it was made for (the dialog is reused across mods)
  const selected = selection?.mod === mod ? selection.version : mod.version
  const isLatest = !selected || selected === mod.version

  const { data, error, isLoading } = useSWR(
    isLatest ? null : `/api/mod-version?${new URLSearchParams({ name: mod.name, version: selected! })}`,
    fetcher,
    { revalidateOnFocus: false },
  )

  const shown = useMemo(() => {
    if (isLatest || !data) return mod
    const merged: Mod = { ...mod }
    for (const key of VERSIONED_FIELDS) (merged as unknown as Record<string, unknown>)[key] = data[key]
    merged.version = selected
    return merged
  }, [isLatest, data, mod, selected])

  return {
    versions,
    selected,
    select: (version) => setSelection({ mod, version }),
    isLatest,
    shown,
    loading: !isLatest && isLoading,
    failed: !isLatest && !!error,
  }
}

export function VersionPicker({ state }: { state: ModVersionState }) {
  const { t, locale } = useT()
  const latest = state.versions[0]?.version

  if (state.versions.length < 2) return <span>{state.selected}</span>

  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <Select value={state.selected} onValueChange={state.select}>
        <SelectTrigger size="sm" aria-label={t("detail.versionPick")} className="min-w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {state.versions.map((v) => (
            <SelectItem key={v.version} value={v.version}>
              <span className="font-medium">{v.version}</span>
              {v.version === latest && <span className="text-xs text-primary">{t("detail.versionLatest")}</span>}
              {v.uploadedTimestamp && (
                <span className="text-xs text-muted-foreground">
                  {new Date(v.uploadedTimestamp).toLocaleDateString(locale)}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground">{t("detail.versionCount", { n: state.versions.length })}</span>
      {state.loading && <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" />}
    </span>
  )
}

// Shown above the details while an older version is selected
export function OlderVersionNotice({ state }: { state: ModVersionState }) {
  const { t } = useT()
  if (state.isLatest) return null
  const latest = state.versions[0]?.version

  return (
    <div
      role="status"
      className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
    >
      <History className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">
        {state.failed ? t("detail.versionLoadError") : t("detail.olderVersionNotice", { v: state.selected ?? "" })}
      </span>
      {latest && (
        <Button variant="outline" size="sm" onClick={() => state.select(latest)}>
          {t("detail.backToLatest")}
        </Button>
      )}
    </div>
  )
}
