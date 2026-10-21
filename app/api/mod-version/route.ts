import { type NextRequest, NextResponse } from "next/server"
import { fetchModVersionFromUpstream } from "@/lib/mods"

// GET /api/mod-version?name=<mod name>&version=<version> — one past version of a mod
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim()
  const version = request.nextUrl.searchParams.get("version")?.trim()
  if (!name || !version || name.length > 200 || version.length > 50) {
    return NextResponse.json({ error: "name and version are required" }, { status: 400 })
  }

  try {
    const mod = await fetchModVersionFromUpstream(name, version)
    if (!mod) return NextResponse.json({ error: "Version not found" }, { status: 404 })
    return NextResponse.json(mod, {
      // Published versions don't change
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    })
  } catch (error) {
    console.error("Mod version fetch error:", error)
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to fetch version", details }, { status: 502 })
  }
}
