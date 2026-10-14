import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
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
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-6">
              <Link href="/" className="flex w-fit items-center gap-4">
                <Image src="/logo.png" alt="ADOMODS Logo" width={60} height={60} className="object-contain" />
                <div>
                  <h1 className="text-3xl font-bold text-balance">
                    <span className="text-primary">ADO</span>MODS
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">A Dance of Fire and Ice Mods</p>
                </div>
              </Link>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">{children}</main>

          <footer className="border-t border-border mt-16">
            <div className="container mx-auto px-4 py-6">
              <p className="text-center text-sm text-muted-foreground">
                Data from{" "}
                <a
                  href="https://bot.adofai.gg/api/mods/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  bot.adofai.gg
                </a>
              </p>
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
