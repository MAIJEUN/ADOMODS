import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ModsProvider } from "@/components/mods-provider"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ADOMODS",
  description: "ADOFAI 게임의 모드 목록을 확인하고 다운로드할 수 있는 웹사이트입니다.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system">
          <ModsProvider>
            <Header />
            {children}
          </ModsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
