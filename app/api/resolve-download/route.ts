import { type NextRequest, NextResponse } from "next/server"
import { getDownloadPlan } from "@/lib/download"
import { resolveDownload } from "@/lib/download-resolvers"

// Turns a release page / folder / hosting page link into direct file links
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")
  const plan = getDownloadPlan(raw ?? undefined)
  // Only links the client would send here; this keeps the route from fetching arbitrary URLs
  if (plan?.kind !== "resolve") {
    return NextResponse.json({ error: "Unsupported URL" }, { status: 400 })
  }

  try {
    const resolved = await resolveDownload(new URL(plan.url))
    if (!resolved) return NextResponse.json({ error: "Unsupported URL" }, { status: 400 })
    return NextResponse.json(resolved, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" },
    })
  } catch (error) {
    console.error("Download resolve error:", error)
    return NextResponse.json(
      { files: [], sourceUrl: plan.url, note: "파일 정보를 가져오지 못했습니다." },
      { status: 502 },
    )
  }
}
