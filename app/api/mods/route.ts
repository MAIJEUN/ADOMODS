import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")?.toLowerCase() || ""
  const sort = searchParams.get("sort") || "uploadedTimestamp"

  try {
    // 재시도 로직 추가
    const maxRetries = 2
    let retries = 0
    let response = null
    let error = null

    while (retries <= maxRetries) {
      try {
        // 타임아웃 설정
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5초 타임아웃

        response = await fetch("https://bot.adofai.gg/api/mods/", {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          break // 성공하면 루프 종료
        }

        error = `API responded with status: ${response.status}`
      } catch (err: any) {
        error = err.message || "Unknown error"
        console.error(`Fetch attempt ${retries + 1} failed:`, err)
      }

      retries++
      if (retries <= maxRetries) {
        // 재시도 전 잠시 대기 (지수 백오프)
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries))
      }
    }

    let mods = []

    if (response && response.ok) {
      try {
        // 응답 본문을 텍스트로 먼저 가져옴
        const text = await response.text()

        // 빈 응답 체크
        if (text && text.trim() !== "") {
          // 텍스트를 JSON으로 파싱
          const data = JSON.parse(text)
          mods = Array.isArray(data) ? data : []
        }
      } catch (parseError) {
        console.error("Error parsing API response:", parseError)
        // 파싱 실패 시 빈 배열 반환
        mods = []
      }
    } else {
      console.error("API request failed after retries:", error)
      // API 요청 실패 시 빈 배열 반환
      mods = []
    }

    // 버전 정보가 있는 모드만 필터링
    mods = mods.filter((mod: any) => mod.version && mod.version.trim() !== "")

    // 검색어로 필터링
    if (query) {
      mods = mods.filter(
        (mod: any) =>
          (mod.name?.toLowerCase() || "").includes(query) ||
          (mod.description?.toLowerCase() || "").includes(query) ||
          (mod.cachedUsername?.toLowerCase() || "").includes(query),
      )
    }

    // 정렬
    mods.sort((a: any, b: any) => {
      switch (sort) {
        case "name":
          return (a.name || "").localeCompare(b.name || "")
        case "version":
          return (b.version || "").localeCompare(a.version || "")
        case "uploadedTimestamp":
        default:
          return (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0)
      }
    })

    return NextResponse.json(mods)
  } catch (error) {
    console.error("Error in API route:", error)
    // 오류 발생 시 빈 배열 반환
    return NextResponse.json([])
  }
}
