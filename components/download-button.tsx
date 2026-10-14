"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, ExternalLink, FileArchive, Loader2 } from "lucide-react"
import { formatFileSize, getDownloadPlan, type ResolvedDownload } from "@/lib/download"

const RESOLVE_FAILED = "파일 정보를 가져오지 못했습니다."

// One lookup per link per page session; failures are retried on the next click
const resolveCache = new Map<string, Promise<ResolvedDownload>>()

function resolve(url: string) {
  let pending = resolveCache.get(url)
  if (!pending) {
    pending = fetch(`/api/resolve-download?url=${encodeURIComponent(url)}`)
      .then((res) => res.json())
      .then((data: ResolvedDownload) => (Array.isArray(data?.files) ? data : Promise.reject()))
      .catch((): ResolvedDownload => {
        resolveCache.delete(url)
        return { files: [], sourceUrl: url, note: RESOLVE_FAILED }
      })
    resolveCache.set(url, pending)
  }
  return pending
}

export function DownloadButton({ url, className, external }: { url?: string; className?: string; external?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [picker, setPicker] = useState<ResolvedDownload | null>(null)
  const plan = getDownloadPlan(url)
  if (!plan) return null

  const label = (
    <>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      다운로드
      {external && <ExternalLink className="ml-2 h-3 w-3" />}
    </>
  )

  if (plan.kind !== "resolve") {
    return (
      <Button className={className} asChild>
        <a href={plan.url} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      </Button>
    )
  }

  const prefetch = () => void resolve(plan.url)

  const handleClick = async () => {
    setLoading(true)
    const result = await resolve(plan.url)
    setLoading(false)
    // A single file downloads right away; popup blockers can still stop it, then the picker is the fallback.
    // (No "noopener" feature: with it window.open always returns null, so a block couldn't be detected.)
    if (result.files.length === 1) {
      const opened = window.open(result.files[0].url, "_blank")
      if (opened) {
        opened.opener = null
        return
      }
    }
    setPicker(result)
  }

  return (
    <>
      <Button
        className={className}
        disabled={loading}
        onClick={handleClick}
        onPointerEnter={prefetch}
        onFocus={prefetch}
      >
        {label}
      </Button>

      <Dialog open={picker !== null} onOpenChange={(open) => !open && setPicker(null)}>
        {picker && (
          <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{picker.files.length > 0 ? "다운로드할 파일 선택" : "파일을 찾지 못했습니다"}</DialogTitle>
              <DialogDescription>
                {picker.title || (picker.files.length > 0 ? "파일을 선택하세요" : "원본 페이지에서 직접 받아주세요.")}
              </DialogDescription>
            </DialogHeader>

            {picker.note && <p className="text-sm text-muted-foreground">{picker.note}</p>}

            {picker.files.length > 0 && (
              <ul className="-mx-2 flex-1 space-y-1 overflow-y-auto">
                {picker.files.map((file) => (
                  <li key={file.url}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setPicker(null)}
                      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
                    >
                      <FileArchive className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
                      {formatFileSize(file.size) && (
                        <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                      )}
                      <Download className="h-4 w-4 shrink-0 text-primary" />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <DialogFooter>
              <Button variant="outline" asChild>
                <a href={picker.sourceUrl} target="_blank" rel="noopener noreferrer">
                  원본 페이지 열기
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
