export async function GET() {
  try {
    const response = await fetch("https://bot.adofai.gg/api/mods/", {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] API response:", data)

    return Response.json(data)
  } catch (error) {
    console.error("[v0] API fetch error:", error)
    return Response.json({ error: "Failed to fetch mods", details: error }, { status: 500 })
  }
}
