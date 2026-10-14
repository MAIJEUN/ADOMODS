import ModsList from "@/components/mods-list"
import { getModsSafe } from "@/lib/mods"

// Rendered with data on the server and regenerated at most every 5 minutes
export const revalidate = 300

export default async function Home() {
  const mods = await getModsSafe()
  return <ModsList initialMods={mods} />
}
