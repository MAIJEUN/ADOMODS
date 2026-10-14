import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { Analytics } from "@vercel/analytics/next"
import { SiteNav } from "@/components/site-nav"
import { ScrollToTop } from "@/components/scroll-to-top"
import { SiteFooter } from "@/components/site-footer"
import { InfoTab } from "@/components/info-tab"
import { NavigationTracker } from "@/components/back-button"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

// Absolute base for link previews (og:image, og:url); Vercel provides the production domain
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ADOMODS - A Dance of Fire and Ice Mods",
    template: "%s - ADOMODS",
  },
  description: "얼불춤 모드 리스트를 시각적으로 편리하게 확인하세요",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${geist.variable} ${geistMono.variable}`}>
      <body className={`font-sans antialiased`}>
        <NavigationTracker />
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:py-6">
              <Link href="/" className="flex w-fit items-center gap-3 sm:gap-4">
                <Image
                  src="/logo.png"
                  alt="ADOMODS Logo"
                  width={60}
                  height={60}
                  className="h-10 w-10 object-contain sm:h-[60px] sm:w-[60px]"
                />
                <div>
                  <h1 className="text-2xl font-bold text-balance sm:text-3xl">
                    <span className="text-primary">ADO</span>MODS
                  </h1>
                  <p className="hidden text-sm text-muted-foreground mt-1 sm:block">A Dance of Fire and Ice Mods</p>
                </div>
              </Link>
              <SiteNav />
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">{children}</main>

          <SiteFooter />
        </div>
        <InfoTab />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  )
}
