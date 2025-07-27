// 지원하는 언어 목록
export type Language = "ko" | "en"

// 번역 데이터 타입
export type TranslationData = {
  [key: string]: string
}

// 언어 이름 (원어로 표시)
export const languageNames: Record<Language, string> = {
  ko: "한국어",
  en: "English",
}

// 번역 데이터
export const translations: Record<Language, TranslationData> = {
  ko: {
    // 공통
    "app.title": "ADOMODS",
    "app.description": "ADOFAI 게임의 모드 목록을 확인하고 다운로드할 수 있는 웹사이트입니다.",

    // 헤더
    "header.lastUpdated": "마지막 업데이트",
    "header.offlineMode": "오프라인 모드",
    "header.unknown": "알 수 없음",
    "header.moreMenu": "더 보기",

    // 테마
    "theme.light": "라이트 모드",
    "theme.dark": "다크 모드",
    "theme.system": "시스템 설정",
    "theme.change": "테마 변경",

    // 언어
    "language.change": "언어 변경",

    // 검색
    "search.placeholder": "모드 검색...",
    "search.button": "검색",
    "search.searching": "검색 중...",
    "search.sortBy": "정렬 기준",
    "search.sortByLatest": "최신순",
    "search.sortByName": "이름순",
    "search.sortByVersion": "버전순",

    // 모드 목록
    "mods.count": "개의 모드",
    "mods.searchResult": "검색어",
    "mods.noResults": "검색 결과가 없습니다",
    "mods.noResultsFor": "에 대한 검색 결과가 없습니다.",
    "mods.notFound": "모드를 찾을 수 없습니다.",
    "mods.refreshData": "데이터 새로고침",
    "mods.loading": "데이터를 불러오는 중...",

    // 모드 카드
    "mod.details": "자세히 보기",
    "mod.download": "다운로드",
    "mod.unknown": "알 수 없는 모드",
    "mod.noVersion": "버전 정보 없음",
    "mod.unknownUser": "알 수 없는 사용자",

    // 모드 상세
    "mod.backToList": "모든 모드 보기",
    "mod.goBack": "이전으로",
    "mod.notFound": "모드를 찾을 수 없습니다",
    "mod.uploadDate": "업로드 날짜",
    "mod.githubPage": "GitHub 페이지",
    "mod.discordMessage": "디스코드 메시지로 이동",
    "mod.installGuide": "모드 설치 가이드",
    "mod.discordServer": "ADOFAI.gg 디스코드",
    "mod.noDescription": "설명이 없습니다.",

    // 오류
    "error.title": "오류가 발생했습니다",
    "error.message": "데이터를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
    "error.retry": "다시 시도",
    "error.backToHome": "홈으로 돌아가기",

    // 데이터 새로고침
    "refresh.button": "데이터 새로고침",
    "refresh.refreshing": "새로고침 중...",

    // 푸터
    "footer.allRightsReserved": "모든 권리 보유.",
    "footer.license": "라이센스",
    "footer.sourceCode": "소스 코드",
    "footer.gameDisclaimer": "ADOMODS는 7th Beat Games에서 제작되거나 승인받지 않았습니다.",
    "footer.siteDisclaimer": "ADOMODS는 ADOFAI.gg에서 제작되거나 승인받지 않았습니다.",
  },
  en: {
    // Common
    "app.title": "ADOMODS",
    "app.description": "A website to browse and download mods for the ADOFAI game.",

    // Header
    "header.lastUpdated": "Last Updated",
    "header.offlineMode": "Offline Mode",
    "header.unknown": "Unknown",
    "header.moreMenu": "More Options",

    // Theme
    "theme.light": "Light Mode",
    "theme.dark": "Dark Mode",
    "theme.system": "System Setting",
    "theme.change": "Change Theme",

    // Language
    "language.change": "Change Language",

    // Search
    "search.placeholder": "Search mods...",
    "search.button": "Search",
    "search.searching": "Searching...",
    "search.sortBy": "Sort by",
    "search.sortByLatest": "Latest",
    "search.sortByName": "Name",
    "search.sortByVersion": "Version",

    // Mods List
    "mods.count": "mods",
    "mods.searchResult": "Search term",
    "mods.noResults": "No results found",
    "mods.noResultsFor": "No results found for",
    "mods.notFound": "No mods found.",
    "mods.refreshData": "Refresh Data",
    "mods.loading": "Loading data...",

    // Mod Card
    "mod.details": "View Details",
    "mod.download": "Download",
    "mod.unknown": "Unknown Mod",
    "mod.noVersion": "No Version Info",
    "mod.unknownUser": "Unknown User",

    // Mod Detail
    "mod.backToList": "Back to all mods",
    "mod.goBack": "Go Back",
    "mod.notFound": "Mod not found",
    "mod.uploadDate": "Upload Date",
    "mod.githubPage": "GitHub Page",
    "mod.discordMessage": "Go to Discord Message",
    "mod.installGuide": "Mod Installation Guide",
    "mod.discordServer": "ADOFAI.gg Discord",
    "mod.noDescription": "No description available.",

    // Error
    "error.title": "An error occurred",
    "error.message": "There was a problem loading the data. Please try again later.",
    "error.retry": "Try Again",
    "error.backToHome": "Back to Home",

    // Data Refresh
    "refresh.button": "Refresh Data",
    "refresh.refreshing": "Refreshing...",

    // Footer
    "footer.allRightsReserved": "All rights reserved.",
    "footer.license": "License",
    "footer.sourceCode": "Source Code",
    "footer.gameDisclaimer": "ADOMODS is not made or endorsed by 7th Beat Games.",
    "footer.siteDisclaimer": "ADOMODS is not made or endorsed by ADOFAI.gg.",
  },
}

// 기본 언어 설정
export const defaultLanguage: Language = "ko"

// 브라우저 언어 감지
export function detectBrowserLanguage(): Language {
  if (typeof window === "undefined") return defaultLanguage

  const browserLang = navigator.language.split("-")[0]
  return browserLang === "en" ? "en" : "ko"
}
