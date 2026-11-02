import { type NextRequest, NextResponse } from "next/server"
import { LANGS, type Lang } from "@/lib/i18n"
import { fetchModVersionFromUpstream } from "@/lib/mods"
import { isTranslationConfigured, MAX_TRANSLATION_CHARS, translateDescription } from "@/lib/translate"

// GET /api/translate?name=<mod name>&version=<version>&lang=<ko|en|zh> — the mod's description in that
// language. The description is looked up here rather than sent by the client, so only real mod
// descriptions ever get translated.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const name = params.get("name")?.trim()
  const version = params.get("version")?.trim()
  const lang = params.get("lang") as Lang | null
  if (!name || name.length > 200 || (version && version.length > 50) || !lang || !LANGS.includes(lang)) {
    return NextResponse.json({ error: "name and lang are required" }, { status: 400 })
  }
  if (!isTranslationConfigured()) {
    return NextResponse.json({ error: "Translation is not configured" }, { status: 503 })
  }

  try {
    // The latest version may only be served at mods/{name}/, so fall back to it when the version matches
    let mod = version ? await fetchModVersionFromUpstream(name, version) : null
    if (!mod) {
      const latest = await fetchModVersionFromUpstream(name)
      if (!version || latest?.version === version) mod = latest
    }
    const description = mod?.description?.trim()
    if (!description) return NextResponse.json({ error: "Description not found" }, { status: 404 })
    if (description.length > MAX_TRANSLATION_CHARS) {
      return NextResponse.json({ error: "Description is too long to translate" }, { status: 413 })
    }

    const text = await translateDescription(description, lang)
    return NextResponse.json(
      { text },
      // Edits to a description show up within a day; the translation itself is cached by content
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    )
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ error: "Translation failed" }, { status: 502 })
  }
}
