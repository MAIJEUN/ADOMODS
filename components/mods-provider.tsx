"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getModsFromStorage, saveModsToStorage, shouldFetchNewData } from "@/lib/storage"

// 컨텍스트 타입 정의
interface ModsContextType {
  mods: any[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  refreshMods: () => Promise<void>
  getMod: (id: string) => Promise<any>
}

// 기본값으로 컨텍스트 생성
const ModsContext = createContext<ModsContextType>({
  mods: [],
  isLoading: true,
  error: null,
  lastUpdated: null,
  refreshMods: async () => {},
  getMod: async () => null,
})

// 컨텍스트 훅
export const useMods = () => useContext(ModsContext)

// 모드 데이터 유효성 검사
function validateModData(mods: any[]): any[] {
  if (!Array.isArray(mods)) {
    console.error("Mods data is not an array:", mods)
    return []
  }

  return mods.filter((mod) => {
    // 필수 필드 확인
    if (!mod || typeof mod !== "object") {
      console.error("Invalid mod entry:", mod)
      return false
    }

    // ID 확인
    if (!mod.id) {
      console.error("Mod missing ID:", mod)
      return false
    }

    // 버전 정보 확인 (이미 필터링 로직이 있지만 추가 검증)
    if (!mod.version || mod.version.trim() === "") {
      console.error("Mod missing version:", mod)
      return false
    }

    return true
  })
}

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

    // 데이터 유효성 검사
    if (!Array.isArray(data)) {
      console.error("API returned non-array data:", data)
      throw new Error("API가 유효하지 않은 데이터 형식을 반환했습니다.")
    }

    // 버전 정보가 있는 모드만 필터링
    const filteredData = data.filter((mod) => mod.version && mod.version.trim() !== "")

    // 추가 데이터 검증
    return validateModData(filteredData)
  } catch (error) {
    console.error("Error fetching mods from API:", error)
    // 더 자세한 오류 정보 제공
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("네트워크 연결 문제가 발생했습니다. 인터넷 연결을 확인해주세요.")
    }
    throw error
  }
}

// 특정 ID의 모드 가져오기
async function fetchModById(id: string) {
  try {
    const res = await fetch(`/api/mods/${id}`, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      throw new Error(`API responded with status: ${res.status}`)
    }

    return await res.json()
  } catch (error) {
    console.error(`Error fetching mod with ID ${id}:`, error)
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
          console.error("API fetch failed:", apiError)

          // API 요청 실패 시 저장된 데이터 사용 또는 빈 배열
          if (storedMods && storedMods.length > 0) {
            // 저장된 데이터 검증
            const validatedStoredMods = validateModData(storedMods)
            setMods(validatedStoredMods)
            setError(`API 요청 실패: 저장된 데이터를 사용합니다. (${apiError.message})`)
          } else {
            // 저장된 데이터도 없으면 빈 배열
            setMods([])
            setError(`API 요청 실패: 데이터를 불러올 수 없습니다. (${apiError.message})`)
          }
        }
      } else {
        // 저장된 데이터 사용
        console.log("Using stored data...")
        // 저장된 데이터 검증
        const validatedStoredMods = validateModData(storedMods)
        setMods(validatedStoredMods)
        const lastFetchedTime = getLastFetchedTime()
        setLastUpdated(lastFetchedTime ? new Date(lastFetchedTime) : new Date())
      }
    } catch (e: any) {
      console.error("Error in fetchMods:", e)
      setError(`데이터를 불러오는 중 오류가 발생했습니다: ${e.message}`)
      // 오류 발생 시 빈 배열
      setMods([])
    } finally {
      setIsLoading(false)
    }
  }

  // 특정 ID의 모드 가져오기
  const getMod = async (id: string) => {
    try {
      // 먼저 현재 로드된 모드 목록에서 찾기
      const foundMod = mods.find((mod) => mod.id === id)
      if (foundMod) {
        return foundMod
      }

      // 로드된 목록에 없으면 API에서 직접 가져오기
      return await fetchModById(id)
    } catch (error) {
      console.error(`Error getting mod with ID ${id}:`, error)
      throw error
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
        getMod,
      }}
    >
      {children}
    </ModsContext.Provider>
  )
}
