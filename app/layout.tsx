import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ModsProvider } from "@/components/mods-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/components/language-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ADOMODS",
  description: "A website where you can check and download a list of mods for ADOFAI games.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ThemeProvider defaultTheme="system">
          <LanguageProvider>
            <ModsProvider>
              <Header />
              <main className="flex-grow pb-8">{children}</main>
              <Footer />
            </ModsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
