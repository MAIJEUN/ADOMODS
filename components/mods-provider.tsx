"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getModsFromStorage, saveModsToStorage, shouldFetchNewData } from "@/lib/storage"
import { mockMods } from "@/lib/mock-data"

// 컨텍스트 타입 정의
interface ModsContextType {
  mods: any[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refreshMods: () => Promise<void>
}

// 기본값으로 컨텍스트 생성
const ModsContext = createContext<ModsContextType>({
  mods: [],
  isLoading: true,
  error: null,
  lastUpdated: null,
  refreshMods: async () => {},
})

// 컨텍스트 훅
export const useMods = () => useContext(ModsContext)

// API에서 모드 데이터 가져오기
async function fetchModsFromApi() {
  try {
    // 클라이언트 측에서 직접 외부 API를 호출하는 대신 내부 API 라우트를 사용
    const res = await fetch("/api/mods", {
      headers: {
        Accept: "application/json",
      },
      // 네트워크 타임아웃 설정
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    })

    if (!res.ok) {
      throw new Error(`API responded with status: ${res.status}`)
    }

    const data = await res.json()
    // 버전 정보가 있는 모드만 필터링
    const filteredData = Array.isArray(data) ? data.filter((mod) => mod.version && mod.version.trim() !== "") : []
    return filteredData
  } catch (error) {
    console.error("Error fetching mods from API:", error)
    // 더 자세한 오류 정보 제공
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("네트워크 연결 문제가 발생했습니다. 인터넷 연결을 확인해주세요.")
    }
    throw error
  }
}

// Helper function to get the last fetched time from local storage
const getLastFetchedTime = (): string | null => {
  try {
    const lastFetchedTime = localStorage.getItem("lastFetchedTime")
    return lastFetchedTime ? lastFetchedTime : null
  } catch (error) {
    console.error("Error getting last fetched time from local storage:", error)
    return null
  }
}

// 프로바이더 컴포넌트
export function ModsProvider({ children }: { children: ReactNode }) {
  const [mods, setMods] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // 모드 데이터 가져오기 함수
  const fetchMods = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 로컬 스토리지에서 데이터 확인
      const storedMods = getModsFromStorage()
      const shouldFetch = shouldFetchNewData() || !storedMods || retryCount > 0

      // 새로운 데이터를 가져와야 하는지 확인
      if (shouldFetch) {
        console.log("Fetching new data from API...")

        try {
          // API에서 데이터 가져오기
          const apiMods = await fetchModsFromApi()

          // 데이터 저장 및 상태 업데이트
          saveModsToStorage(apiMods)
          setMods(apiMods)
          setLastUpdated(new Date())
          setRetryCount(0) // 성공 시 재시도 카운트 초기화
          console.log("Data successfully fetched and saved")
        } catch (apiError: any) {
          console.error("API fetch failed, using mock or stored data:", apiError)

          // API 요청 실패 시 저장된 데이터 또는 모의 데이터 사용
          if (storedMods && storedMods.length > 0) {
            setMods(storedMods)
            setError(`API 요청 실패: 저장된 데이터를 사용합니다. (${apiError.message})`)
          } else {
            setMods(mockMods)
            setError(`API 요청 실패: 모의 데이터를 사용합니다. (${apiError.message})`)
          }
        }
      } else {
        // 저장된 데이터 사용
        console.log("Using stored data...")
        setMods(storedMods)
        const lastFetchedTime = getLastFetchedTime()
        setLastUpdated(lastFetchedTime ? new Date(lastFetchedTime) : new Date())
      }
    } catch (e: any) {
      console.error("Error in fetchMods:", e)
      setError(`데이터를 불러오는 중 오류가 발생했습니다: ${e.message}`)
      setMods(mockMods)
    } finally {
      setIsLoading(false)
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchMods()
  }, [])

  // 수동 새로고침 함수
  const refreshMods = async () => {
    setRetryCount((prev) => prev + 1) // 재시도 카운트 증가
    await fetchMods()
  }

  return (
    <ModsContext.Provider
      value={{
        mods,
        isLoading,
        error,
        lastUpdated,
        refreshMods,
      }}
    >
      {children}
    </ModsContext.Provider>
  )
}
