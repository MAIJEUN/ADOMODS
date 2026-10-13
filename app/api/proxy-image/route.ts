import { type NextRequest, NextResponse } from "next/server"
import { isProxyableImageUrl } from "@/lib/image-proxy"

const MAX_IMAGE_BYTES = 20 * 1024 * 1024

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url")
  if (!imageUrl) {
    return new NextResponse("Missing image URL", { status: 400 })
  }

  let target: URL
  try {
    target = new URL(imageUrl)
  } catch {
    return new NextResponse("Invalid image URL", { status: 400 })
  }

  // Only allow known image CDNs to prevent SSRF / open-proxy abuse
  if (!isProxyableImageUrl(target)) {
    return new NextResponse("Host not allowed", { status: 403 })
  }

  try {
    const response = await fetch(target, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      // A redirect could point outside the allowlist
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok || !response.body) {
      // Discord attachment URLs are signed and expire (ex= param), which shows up here as 404
      return new NextResponse("Failed to fetch image", { status: response.status === 404 ? 404 : 502 })
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Not an image", { status: 415 })
    }

    const contentLength = Number(response.headers.get("content-length") || 0)
    if (contentLength > MAX_IMAGE_BYTES) {
      return new NextResponse("Image too large", { status: 413 })
    }

    const headers = new Headers({
      "Content-Type": contentType,
      // Signed Discord URLs expire, so don't pin them forever
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Content-Type-Options": "nosniff",
    })
    if (contentLength) headers.set("Content-Length", String(contentLength))

    return new NextResponse(response.body, { headers })
  } catch (error) {
    console.error("Image proxy error:", error)
    return new NextResponse("Failed to proxy image", { status: 502 })
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
