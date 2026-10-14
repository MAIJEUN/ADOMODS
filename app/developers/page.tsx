import type { Metadata } from "next"
import DevelopersList from "@/components/developers-list"
import { getModsSafe } from "@/lib/mods"

export const revalidate = 300

export const metadata: Metadata = {
  title: "개발자",
  description: "얼불춤(A Dance of Fire and Ice) 모드 개발자 목록",
}

export default async function DevelopersPage() {
  return <DevelopersList initialMods={await getModsSafe()} />
}
