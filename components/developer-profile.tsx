"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, ExternalLink, Loader2, Package } from "lucide-react"
import { proxyImage } from "@/lib/image-proxy"
import { formatDate, getAvatarUrl, isModOfDeveloper, type Mod } from "@/lib/mods"
import { ModCard, useModDialog, useMods } from "@/components/mod-card"

function Avatar({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted text-3xl font-bold text-muted-foreground">
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <img
      src={proxyImage(src)}
      alt={`${name} 프로필 이미지`}
      className="h-20 w-20 shrink-0 rounded-full border border-border object-cover"
      onError={() => setFailed(true)}
    />
  )
}

export default function DeveloperProfile({ developerId }: { developerId: string }) {
  const { mods, error, isLoading } = useMods()
  const { openMod, dialog } = useModDialog()

  const developerMods = useMemo(
    () =>
      mods
        .filter((mod: Mod) => mod.version && isModOfDeveloper(mod, developerId))
        .sort((a, b) => (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0)),
    [mods, developerId],
  )

  // Newest entry has the most recent cached name/avatar
  const latest = developerMods[0]
  const name = latest?.cachedUsername || developerId
  const avatarUrl = developerMods.map(getAvatarUrl).find(Boolean) ?? null
  const firstUpload = developerMods[developerMods.length - 1]?.uploadedTimestamp
  const discordProfileUrl = latest?.user && /^\d+$/.test(latest.user) ? `https://discord.com/users/${latest.user}` : null

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          전체 모드
        </Link>
      </Button>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">오류 발생</CardTitle>
            <CardDescription>
              모드 데이터를 불러올 수 없습니다. API 연결을 확인해주세요.
              <br />
              <span className="text-xs font-mono mt-2 block">{error.message}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && developerMods.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>개발자를 찾을 수 없습니다</CardTitle>
            <CardDescription>이 개발자가 올린 모드가 없거나 잘못된 주소입니다.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && !error && developerMods.length > 0 && (
        <>
          <section className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar src={avatarUrl} name={name} />
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-3xl font-bold break-words">{name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  모드 {developerMods.length}개
                </span>
                {firstUpload && latest?.uploadedTimestamp && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {firstUpload === latest.uploadedTimestamp
                      ? formatDate(firstUpload)
                      : `${formatDate(firstUpload)} ~ ${formatDate(latest.uploadedTimestamp)}`}
                  </span>
                )}
              </div>
            </div>
            {discordProfileUrl && (
              <Button variant="outline" asChild>
                <a href={discordProfileUrl} target="_blank" rel="noopener noreferrer">
                  디스코드 프로필
                  <ExternalLink className="ml-2 h-3 w-3" />
                </a>
              </Button>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">모드</h3>
              <Badge variant="secondary">{developerMods.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {developerMods.map((mod, index) => (
                <ModCard key={mod.id || mod._id || index} mod={mod} onOpen={openMod} showDeveloper={false} />
              ))}
            </div>
          </section>
        </>
      )}

      {dialog}
    </div>
  )
}
