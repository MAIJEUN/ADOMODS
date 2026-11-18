import type React from "react"
import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { SiteNav } from "@/components/site-nav"
import { ScrollToTop } from "@/components/scroll-to-top"
import { SiteFooter } from "@/components/site-footer"
import { InfoTab } from "@/components/info-tab"
import { NavigationTracker } from "@/components/back-button"
import { Wordmark } from "@/components/wordmark"
import { siteUrl } from "@/lib/site"
import "./globals.css"

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
      { url: "/favicon.ico?v=5", sizes: "48x48" },
      // Google shows site icons only in multiples of 48px
      { url: "/icon.png?v=5", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-icon.png?v=5",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={geistMono.variable}>
      <head>
        {/* Pretendard: Korean and Latin in one face. The dynamic subset loads only the glyphs a page uses */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className={`font-sans antialiased`}>
        <NavigationTracker />
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 flex h-14 items-center justify-between gap-4 sm:h-15">
              <Link href="/" className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                {/* Not a heading: each page has its own h1 */}
                <span className="text-lg font-bold tracking-tight">
                  <Wordmark />
                </span>
              </Link>
              <SiteNav />
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">{children}</main>

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
