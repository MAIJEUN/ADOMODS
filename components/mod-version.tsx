"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { History } from "lucide-react"
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
  // The mod list doesn't include version history; the single-mod endpoint does, so fetch it on demand
  const { data: history } = useSWR(
    mod.versions?.length ? null : `/api/mod-version?${new URLSearchParams({ name: mod.name })}`,
    fetcher,
    { revalidateOnFocus: false },
  )
  const versions = useMemo(
    () => getModVersions(mod.versions?.length ? mod : { ...mod, versions: history?.versions }),
    [mod, history],
  )
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

export function VersionPicker({ state, className }: { state: ModVersionState; className?: string }) {
  const { t, locale } = useT()
  const latest = state.versions[0]?.version

  return (
    <Select value={state.selected} onValueChange={state.select}>
      <SelectTrigger aria-label={t("detail.versionPick")} className={className}>
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
  )
}

// Shown under the version picker while an older version is selected
export function OlderVersionNotice({ state }: { state: ModVersionState }) {
  const { t } = useT()
  if (state.isLatest) return null
  const latest = state.versions[0]?.version

  return (
    <div role="status" className="space-y-2 rounded-md border border-border bg-muted/50 p-3 text-sm">
      <p className="flex items-start gap-2">
        <History aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        {state.failed ? t("detail.versionLoadError") : t("detail.olderVersionNotice", { v: state.selected ?? "" })}
      </p>
      {latest && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => state.select(latest)}>
          {t("detail.backToLatest")}
        </Button>
      )}
    </div>
  )
}
