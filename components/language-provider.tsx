"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { type Language, defaultLanguage, detectBrowserLanguage, translations } from "@/lib/i18n"

// 컨텍스트 타입 정의
interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

// 기본값으로 컨텍스트 생성
const LanguageContext = createContext<LanguageContextType>({
  language: defaultLanguage,
  setLanguage: () => {},
  t: (key) => key,
})

// 컨텍스트 훅
export const useLanguage = () => useContext(LanguageContext)

// 프로바이더 컴포넌트
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(defaultLanguage)

  // 브라우저 언어 감지 및 로컬 스토리지에서 언어 설정 불러오기
  useEffect(() => {
    try {
      const storedLanguage = localStorage.getItem("language") as Language | null
      if (storedLanguage && (storedLanguage === "ko" || storedLanguage === "en")) {
        setLanguage(storedLanguage)
      } else {
        const browserLanguage = detectBrowserLanguage()
        setLanguage(browserLanguage)
      }
    } catch (error) {
      console.error("Error loading language setting:", error)
    }
  }, [])

  // 언어 변경 함수
  const changeLanguage = (newLanguage: Language) => {
    try {
      localStorage.setItem("language", newLanguage)
      setLanguage(newLanguage)
    } catch (error) {
      console.error("Error saving language setting:", error)
    }
  }

  // 번역 함수
  const t = (key: string): string => {
    try {
      return translations[language][key] || key
    } catch (error) {
      console.error(`Translation error for key "${key}":`, error)
      return key
    }
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: changeLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}
