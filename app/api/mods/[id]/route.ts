import { type NextRequest, NextResponse } from "next/server"

// The bot API no longer serves mods by ID (single-mod URLs are by name now), so find it in the list
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const res = await fetch("https://bot.adofai.gg/api/mods/", {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      console.error(`API responded with status: ${res.status}`)
      return NextResponse.json({ error: "Failed to fetch mod data" }, { status: 502 })
    }

    const data = await res.json()
    const mods: any[] = Array.isArray(data) ? data : []
    const mod = mods.find((m) => String(m?.id) === id || m?._id === id)
    if (!mod) {
      return NextResponse.json({ error: "Mod not found" }, { status: 404 })
    }
    return NextResponse.json(mod)
  } catch (error) {
    console.error("Error fetching mod data:", error)
    return NextResponse.json({ error: "Failed to fetch mod data" }, { status: 500 })
  }
}
