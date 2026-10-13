import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch("https://bot.adofai.gg/api/mods/", {
      headers: {
        Accept: "application/json",
      },
      // Cache upstream response for 5 minutes instead of hitting the bot API on every visit
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    })
  } catch (error) {
    console.error("Mods API fetch error:", error)
    // Error objects serialize to {}, so send the message instead
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to fetch mods", details }, { status: 502 })
  }
}
