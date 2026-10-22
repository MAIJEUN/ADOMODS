import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { SiteNav } from "@/components/site-nav"
import { ScrollToTop } from "@/components/scroll-to-top"
import { SiteFooter } from "@/components/site-footer"
import { InfoTab } from "@/components/info-tab"
import { NavigationTracker } from "@/components/back-button"
import { siteUrl } from "@/lib/site"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

const description =
  "얼불춤(A Dance of Fire and Ice, ADOFAI) 모드 목록. 최신 모드를 검색하고 버전별로 바로 다운로드하세요."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ADOMODS - 얼불춤 모드 목록 | A Dance of Fire and Ice Mods",
    template: "%s - ADOMODS",
  },
  description,
  applicationName: "ADOMODS",
  keywords: ["얼불춤", "얼불춤 모드", "A Dance of Fire and Ice", "ADOFAI", "ADOFAI mods", "모드", "mod"],
  generator: "v0.app",
  openGraph: {
    type: "website",
    siteName: "ADOMODS",
    locale: "ko_KR",
    title: "ADOMODS - 얼불춤 모드 목록",
    description,
    images: ["/logo.png"],
  },
  twitter: { card: "summary", title: "ADOMODS - 얼불춤 모드 목록", description },
  // Ownership checks for Google Search Console, Naver Search Advisor and Bing Webmaster Tools
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      ...(process.env.NAVER_SITE_VERIFICATION && { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION }),
      ...(process.env.BING_SITE_VERIFICATION && { "msvalidate.01": process.env.BING_SITE_VERIFICATION }),
    },
  },
  // ?v= busts browsers' favicon cache when the icons change
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", sizes: "48x48" },
      { url: "/icon.png?v=4", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png?v=4",
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
        <SpeedInsights />
      </body>
    </html>
  )
}
