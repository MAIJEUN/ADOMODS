// 로컬 스토리지 관련 유틸리티 함수

// 로컬 스토리지 키
const STORAGE_KEYS = {
  MODS_DATA: "adofai-mods-data",
  LAST_FETCHED: "adofai-mods-last-fetched",
}

// 브라우저 환경 확인 (SSR 대응)
const isBrowser = typeof window !== "undefined"

// 데이터 저장
export function saveModsToStorage(mods: any[]) {
  if (!isBrowser) return false

  try {
    // 데이터 저장
    localStorage.setItem(STORAGE_KEYS.MODS_DATA, JSON.stringify(mods))
    // 마지막 업데이트 시간 저장
    localStorage.setItem(STORAGE_KEYS.LAST_FETCHED, Date.now().toString())
    return true
  } catch (error) {
    console.error("Error saving mods to localStorage:", error)
    return false
  }
}

// 데이터 불러오기
export function getModsFromStorage() {
  if (!isBrowser) return null

  try {
    const modsData = localStorage.getItem(STORAGE_KEYS.MODS_DATA)
    if (!modsData) return null
    return JSON.parse(modsData)
  } catch (error) {
    console.error("Error getting mods from localStorage:", error)
    return null
  }
}

// 마지막 업데이트 시간 확인
export function getLastFetchedTime() {
  if (!isBrowser) return null

  try {
    const lastFetched = localStorage.getItem(STORAGE_KEYS.LAST_FETCHED)
    return lastFetched ? Number.parseInt(lastFetched, 10) : null
  } catch (error) {
    console.error("Error getting last fetched time from localStorage:", error)
    return null
  }
}

// 데이터 업데이트가 필요한지 확인 (24시간 기준)
export function shouldFetchNewData() {
  if (!isBrowser) return true

  const lastFetched = getLastFetchedTime()
  if (!lastFetched) return true

  const now = Date.now()
  const oneDayInMs = 24 * 60 * 60 * 1000 // 24시간을 밀리초로 변환

  return now - lastFetched > oneDayInMs
}

// 스토리지 초기화 (테스트용)
export function clearModsStorage() {
  if (!isBrowser) return

  try {
    localStorage.removeItem(STORAGE_KEYS.MODS_DATA)
    localStorage.removeItem(STORAGE_KEYS.LAST_FETCHED)
  } catch (error) {
    console.error("Error clearing mods storage:", error)
  }
}
