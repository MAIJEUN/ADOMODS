import type { Metadata } from "next"
import DeveloperProfile from "@/components/developer-profile"
import { fetchModsFromUpstream, isModOfDeveloper } from "@/lib/mods"

type Props = { params: Promise<{ id: string }> }

const decodeId = (id: string) => {
  try {
    return decodeURIComponent(id)
  } catch {
    return id
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = decodeId((await params).id)
  try {
    const mods = await fetchModsFromUpstream()
    const name = mods.find((mod) => isModOfDeveloper(mod, id) && mod.cachedUsername)?.cachedUsername
    if (name) {
      return { title: name, description: `${name}님이 만든 얼불춤(A Dance of Fire and Ice) 모드 목록` }
    }
  } catch {
    // Metadata is best-effort; the page itself loads data on the client
  }
  return { title: "개발자" }
}

export default async function DeveloperPage({ params }: Props) {
  const id = decodeId((await params).id)
  return <DeveloperProfile developerId={id} />
}
