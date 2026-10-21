import { type NextRequest, NextResponse } from "next/server"
import { fetchModVersionFromUpstream } from "@/lib/mods"

// GET /api/mod-version?name=<mod name>&version=<version> — one past version of a mod.
// Without version: the mod's latest entry, which carries the full version history.
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim()
  const version = request.nextUrl.searchParams.get("version")?.trim()
  if (!name || name.length > 200 || (version && version.length > 50)) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  try {
    const mod = await fetchModVersionFromUpstream(name, version || undefined)
    if (!mod) return NextResponse.json({ error: "Version not found" }, { status: 404 })
    return NextResponse.json(mod, {
      // Published versions don't change; the latest entry may get a new version
      headers: {
        "Cache-Control": version
          ? "public, s-maxage=86400, stale-while-revalidate=604800"
          : "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("Mod version fetch error:", error)
    const details = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to fetch version", details }, { status: 502 })
  }
}
