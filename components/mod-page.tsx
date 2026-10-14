"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getModId, type Mod } from "@/lib/mods"
import { useT } from "@/lib/use-lang"
import { useMods } from "@/components/mod-card"
import { ModDetailActions, ModDetailBody } from "@/components/mod-detail"
import { DiscordText } from "@/components/mod-markdown"

// Standalone page for a shared /mods/[id] link
export default function ModPage({ modId, initialMods }: { modId: string; initialMods?: Mod[] }) {
  const { t } = useT()
  const { mods, isLoading } = useMods(initialMods)
  const mod = mods.find((m) => getModId(m) === modId)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* scroll={false}: the list restores its own scroll position */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/" scroll={false}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.allMods")}
        </Link>
      </Button>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && !mod && (
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.notFound")}</CardTitle>
            <CardDescription>{t("detail.notFoundHint")}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {mod && (
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              <h2>
                <DiscordText text={mod.name} />
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ModDetailBody mod={mod} />
          </CardContent>
          <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-6">
            <ModDetailActions mod={mod} />
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
