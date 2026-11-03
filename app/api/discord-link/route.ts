import { type NextRequest, NextResponse } from "next/server"
import { canRefreshDiscordUrls, isDiscordAttachmentUrl, isDiscordUrlExpired, refreshDiscordUrl } from "@/lib/discord-cdn"

// GET /api/discord-link?url=<Discord attachment URL> — redirects to the attachment, re-signed first when
// its link has expired, so file and video links in descriptions keep working after a day
export async function GET(request: NextRequest) {
  let target: URL
  try {
    target = new URL(request.nextUrl.searchParams.get("url") ?? "")
  } catch {
    return new NextResponse("Invalid URL", { status: 400 })
  }
  // Only Discord attachments, so this can't be used as an open redirect
  if (target.protocol !== "https:" || !isDiscordAttachmentUrl(target)) {
    return new NextResponse("Not a Discord attachment", { status: 400 })
  }

  if (canRefreshDiscordUrls() && isDiscordUrlExpired(target)) {
    try {
      target = (await refreshDiscordUrl(target)) ?? target
    } catch (error) {
      console.error("Discord link refresh error:", error)
    }
  }
  return NextResponse.redirect(target, {
    status: 302,
    // A re-signed link stays valid for about a day
    headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
  })
}

export const runtime = "nodejs"
