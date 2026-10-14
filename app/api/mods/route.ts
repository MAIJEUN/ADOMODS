import { NextResponse } from "next/server"
import { fetchModsFromUpstream } from "@/lib/mods"

export async function GET() {
  try {
    const mods = await fetchModsFromUpstream()
    return NextResponse.json(mods, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (error) {
    console.error("Mods API fetch error:", error)
    // Error objects serialize to {}, so send the message instead
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to fetch mods", details }, { status: 502 })
  }
}
