import type { Metadata } from "next"
import DeveloperProfile from "@/components/developer-profile"
import { getModsSafe, isModOfDeveloper } from "@/lib/mods"

type Props = { params: Promise<{ id: string }> }

// Pages are generated on first visit and cached, regenerated at most every 5 minutes
export const revalidate = 300
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

async function getDeveloperMods(id: string) {
  return (await getModsSafe()).filter((mod) => isModOfDeveloper(mod, id))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = decodeId((await params).id)
  const name = (await getDeveloperMods(id)).find((mod) => mod.cachedUsername)?.cachedUsername
  if (name) {
    return { title: name, description: `${name}님이 만든 얼불춤(A Dance of Fire and Ice) 모드 목록` }
  }
  return { title: "개발자" }
}

export default async function DeveloperPage({ params }: Props) {
  const id = decodeId((await params).id)
  // Only this developer's mods are sent with the page
  return <DeveloperProfile developerId={id} initialMods={await getDeveloperMods(id)} />
}
