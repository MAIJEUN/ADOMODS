import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id

  try {
    // 특정 모드 ID로 API 요청 시도
    const res = await fetch(`https://bot.adofai.gg/api/mods/${id}`, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
      },
    })

    if (res.ok) {
      try {
        // 응답 본문을 텍스트로 먼저 가져옴
        const text = await res.text()

        // 빈 응답 체크
        if (!text || text.trim() === "") {
          console.error("API returned empty response for specific mod")
          return NextResponse.json({ error: "Mod not found" }, { status: 404 })
        }

        // 텍스트를 JSON으로 파싱
        const data = JSON.parse(text)
        return NextResponse.json(data)
      } catch (parseError) {
        console.error("Failed to parse JSON for specific mod:", parseError)
        return NextResponse.json({ error: "Failed to parse mod data" }, { status: 500 })
      }
    } else {
      console.error(`API responded with status: ${res.status}`)
      return NextResponse.json({ error: "Mod not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error fetching mod data:", error)
    return NextResponse.json({ error: "Failed to fetch mod data" }, { status: 500 })
  }
}
