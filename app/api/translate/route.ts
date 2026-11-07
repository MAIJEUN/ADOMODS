import { type NextRequest, NextResponse } from "next/server"
import { LANGS, type Lang } from "@/lib/i18n"
import { fetchModVersionFromUpstream } from "@/lib/mods"
import {
  isTranslationConfigured,
  MAX_TRANSLATION_CHARS,
  translateDescription,
  TranslationRateLimitError,
} from "@/lib/translate"

// Only the site's own pages may ask. Browsers send Sec-Fetch-Site on fetch(); where it's missing (older
// browsers), the Referer has to be this site. This stops other sites and casual scripts, not a determined
// client, which the rate limit and the cache are for.
function isFromThisSite(request: NextRequest) {
  const site = request.headers.get("sec-fetch-site")
  if (site) return site === "same-origin"
  const referer = request.headers.get("referer")
  try {
    return !!referer && new URL(referer).host === request.headers.get("host")
  } catch {
    return false
  }
}

const clientOf = (request: NextRequest) =>
  request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"

const noStore = { "Cache-Control": "no-store" }

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
  if (!isFromThisSite(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: noStore })
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

    const outcome = await translateDescription(description, lang, clientOf(request))
    if ("failed" in outcome) {
      return NextResponse.json({ error: "Translation failed" }, { status: 422, headers: noStore })
    }
    // Private: a shared CDN copy would be served to requests that skip the checks above
    return NextResponse.json(
      { text: outcome.text },
      { headers: { "Cache-Control": "private, max-age=86400" } },
    )
  } catch (error) {
    if (error instanceof TranslationRateLimitError) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { ...noStore, "Retry-After": "600" } })
    }
    console.error("Translation error:", error)
    return NextResponse.json({ error: "Translation failed" }, { status: 502, headers: noStore })
  }
}
