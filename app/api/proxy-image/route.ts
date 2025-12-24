import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("[v0] Proxy image request received")

  const searchParams = request.nextUrl.searchParams
  const imageUrl = searchParams.get("url")

  console.log("[v0] Requested image URL:", imageUrl)

  if (!imageUrl) {
    return new NextResponse("Missing image URL", { status: 400 })
  }

  try {
    console.log("[v0] Fetching image from:", imageUrl)
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    console.log("[v0] Fetch response status:", response.status)

    if (!response.ok) {
      console.error("[v0] Failed to fetch image, status:", response.status)
      return new NextResponse("Failed to fetch image", { status: response.status })
    }

    const contentType = response.headers.get("content-type") || "image/jpeg"
    const imageBuffer = await response.arrayBuffer()

    console.log("[v0] Successfully proxied image, content-type:", contentType)

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[v0] Image proxy error:", error)
    return new NextResponse("Failed to proxy image", { status: 500 })
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
