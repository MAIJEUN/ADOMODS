import type { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import DeveloperProfile from "@/components/developer-profile"
import { getModsSafe, isModOfDeveloper, resolveDeveloper } from "@/lib/mods"

type Props = { params: Promise<{ id: string }> }

// Pages are generated on first visit and cached, regenerated at most hourly (see app/mods/[id]/page.tsx)
export const revalidate = 3600
export function generateStaticParams() {
  return []
}

const decodeId = (id: string) => {
  try {
    return decodeURIComponent(id)
  } catch {
    return id
  }
}

// The URL key is a handle (current or old) or a user ID
async function findDeveloper(key: string) {
  const mods = await getModsSafe()
  const developer = resolveDeveloper(mods, key)
  const id = developer?.id ?? key
  // Newest first: the newest mod has the current handle
  const devMods = mods
    .filter((mod) => isModOfDeveloper(mod, id))
    .sort((a, b) => (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0))
  return { mods, developer, id, devMods }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { developer, devMods } = await findDeveloper(decodeId((await params).id))
  const name = devMods.find((mod) => mod.cachedUsername)?.cachedUsername
  if (developer && name) {
    return {
      title: name,
      description: `${name}님이 만든 얼불춤(A Dance of Fire and Ice) 모드 목록`,
      alternates: { canonical: developer.path },
    }
  }
  return { title: "개발자" }
}

export default async function DeveloperPage({ params }: Props) {
  const key = decodeId((await params).id)
  const { mods, developer, id, devMods } = await findDeveloper(key)
  // An empty list means the API failed; let the client retry instead of a hard 404
  if (mods.length > 0 && !developer) notFound()
  // User IDs and old handles go to the current handle's address
  if (developer && developer.path !== `/developers/${encodeURIComponent(key)}`) permanentRedirect(developer.path)
  // Only this developer's mods are sent with the page
  return <DeveloperProfile developerId={id} initialMods={devMods} />
}
