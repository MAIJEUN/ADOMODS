import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ModsProvider } from "@/components/mods-provider"
import { Header } from "@/components/header"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ADOMODS",
  description: "A website where you can check and download a list of mods for ADOFAI games.",
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
          <LanguageProvider>
            <ModsProvider>
              <Header />
              {children}
            </ModsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
