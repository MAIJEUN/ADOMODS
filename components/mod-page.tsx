"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { getModId, type Mod } from "@/lib/mods"
import { useT } from "@/lib/use-lang"
import { BackButton } from "@/components/back-button"
import { useMods } from "@/components/mod-card"
import { ModDetailView } from "@/components/mod-detail"
import { DiscordText } from "@/components/mod-markdown"

// Standalone page for a shared /mods/[id] link
export default function ModPage({ modId, initialMods }: { modId: string; initialMods?: Mod[] }) {
  const { t } = useT()
  const { mods, isLoading } = useMods(initialMods)
  const mod = mods.find((m) => getModId(m) === modId)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <BackButton fallbackHref="/" fallbackLabel="common.allMods" />

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

      {mod && <ModPageCard mod={mod} />}
    </div>
  )
}

function ModPageCard({ mod }: { mod: Mod }) {
  return (
    // No overflow-hidden here: it would stop the sidebar from sticking
    <Card className="gap-0 py-0">
      <CardHeader className="border-b border-border py-5">
        <CardTitle className="text-3xl">
          <h2>
            <DiscordText text={mod.name} />
          </h2>
        </CardTitle>
      </CardHeader>
      <ModDetailView mod={mod} />
    </Card>
  )
}
