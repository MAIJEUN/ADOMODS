"use client"

import { useState } from "react"
import useSWR from "swr"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, ExternalLink, Loader2, Info, User, Calendar, Hash } from "lucide-react"

interface Mod {
  _id?: string
  id: string | number
  name: string
  description?: string
  author?: string
  cachedUsername?: string
  version?: string
  downloads?: number
  thumbnail?: string
  download?: string
  downloadUrl?: string
  category?: string
  uploadedTimestamp?: number
  user?: string
  guild?: string
  channel?: string
  message?: string
  cachedAvatar?: string
  [key: string]: any
}

type SortType = "newest" | "oldest" | "name-asc" | "name-desc"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch mods")
  const json = await res.json()
  return json
}

const formatDate = (timestamp?: number) => {
  if (!timestamp) return "알 수 없음"
  return new Date(timestamp).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const generateModMarkdown = (mod: Mod) => {
  const sections = []

  sections.push(`# ${mod.name}\n`)

  if (mod.description) {
    sections.push(`## 설명\n${mod.description}\n`)
  }

  sections.push(`## 기본 정보`)
  if (mod.cachedUsername) {
    sections.push(`- **제작자:** ${mod.cachedUsername}`)
  }
  if (mod.version) {
    sections.push(`- **버전:** ${mod.version}`)
  }
  if (mod.uploadedTimestamp) {
    sections.push(`- **업로드 날짜:** ${formatDate(mod.uploadedTimestamp)}`)
  }

  sections.push(`\n## 기술 정보`)
  sections.push(`- **모드 ID:** \`${mod.id}\``)
  if (mod.user) {
    sections.push(`- **사용자 ID:** \`${mod.user}\``)
  }
  if (mod.guild) {
    sections.push(`- **길드 ID:** \`${mod.guild}\``)
  }
  if (mod.channel) {
    sections.push(`- **채널 ID:** \`${mod.channel}\``)
  }
  if (mod.message) {
    sections.push(`- **메시지 ID:** \`${mod.message}\``)
  }

  if (mod.download) {
    sections.push(`\n## 다운로드\n[다운로드 링크](${mod.download})`)
  }

  return sections.join("\n")
}

export default function ModsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortType>("newest")

  const { data, error, isLoading } = useSWR("/api/mods", fetcher, {
    revalidateOnFocus: false,
  })

  const modsArray = Array.isArray(data) ? data : data?.mods || data?.data || []

  const filteredAndSortedMods = modsArray
    .filter((mod: Mod) => mod.version) // Only show mods with version
    .filter((mod: Mod) => {
      const query = searchQuery.toLowerCase()
      return (
        mod.name?.toLowerCase().includes(query) ||
        mod.description?.toLowerCase().includes(query) ||
        mod.author?.toLowerCase().includes(query) ||
        mod.cachedUsername?.toLowerCase().includes(query)
      )
    })
    .sort((a: Mod, b: Mod) => {
      switch (sortBy) {
        case "newest":
          return (b.uploadedTimestamp || 0) - (a.uploadedTimestamp || 0)
        case "oldest":
          return (a.uploadedTimestamp || 0) - (b.uploadedTimestamp || 0)
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "")
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "")
        default:
          return 0
      }
    })

  return (
    <div className="space-y-6">
      {/* Search Bar and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="모드 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">최신순</SelectItem>
              <SelectItem value="oldest">오래된순</SelectItem>
              <SelectItem value="name-asc">이름순 (가-하)</SelectItem>
              <SelectItem value="name-desc">이름순 (하-가)</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="secondary" className="px-3 py-1">
            {filteredAndSortedMods.length} 모드
          </Badge>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">오류 발생</CardTitle>
            <CardDescription>
              모드 데이터를 불러올 수 없습니다. API 연결을 확인해주세요.
              <br />
              <span className="text-xs font-mono mt-2 block">{error.message}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Mods Grid */}
      {!isLoading && !error && (
        <>
          {filteredAndSortedMods.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{modsArray.length === 0 ? "모드 데이터가 없습니다" : "검색 결과가 없습니다"}</CardTitle>
                <CardDescription>
                  {modsArray.length === 0 ? "API에서 데이터를 가져오지 못했습니다." : "다른 키워드로 검색해보세요."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedMods.map((mod: Mod, index: number) => (
                <Card
                  key={mod.id || mod._id || index}
                  className="group hover:border-primary/50 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  {mod.thumbnail && (
                    <div className="aspect-video w-full bg-muted relative overflow-hidden">
                      <img
                        src={mod.thumbnail || "/placeholder.svg"}
                        alt={mod.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">{mod.name}</CardTitle>
                      {mod.category && (
                        <Badge variant="outline" className="shrink-0">
                          {mod.category}
                        </Badge>
                      )}
                    </div>
                    {mod.description && <CardDescription className="line-clamp-2">{mod.description}</CardDescription>}
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    <div className="flex-1 space-y-2 text-sm">
                      {mod.cachedUsername && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="text-foreground font-medium">{mod.cachedUsername}</span>
                        </div>
                      )}
                      {mod.version && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Hash className="h-4 w-4" />
                          <span>버전: {mod.version}</span>
                        </div>
                      )}
                      {mod.uploadedTimestamp && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(mod.uploadedTimestamp)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {mod.download && (
                        <Button className="flex-1" asChild>
                          <a href={mod.download} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" />
                            다운로드
                          </a>
                        </Button>
                      )}

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 bg-transparent">
                            <Info className="mr-2 h-4 w-4" />
                            자세히
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                          <DialogHeader className="flex-shrink-0">
                            <DialogTitle className="text-2xl">{mod.name}</DialogTitle>
                            <DialogDescription>모드 상세 정보</DialogDescription>
                          </DialogHeader>

                          <div className="flex-1 overflow-y-auto pr-2">
                            <div className="prose prose-sm dark:prose-invert max-w-none [&>*]:break-words">
                              <ReactMarkdown
                                components={{
                                  h1: ({ node, ...props }) => (
                                    <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
                                  ),
                                  h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-3 mb-2" {...props} />,
                                  p: ({ node, ...props }) => <p className="mb-2 break-words" {...props} />,
                                  ul: ({ node, ...props }) => (
                                    <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />
                                  ),
                                  li: ({ node, ...props }) => <li className="break-words" {...props} />,
                                  code: ({ node, inline, ...props }) =>
                                    inline ? (
                                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm break-all" {...props} />
                                    ) : (
                                      <code className="block bg-muted p-2 rounded text-sm overflow-x-auto" {...props} />
                                    ),
                                  a: ({ node, ...props }) => (
                                    <a className="text-primary hover:underline break-all" {...props} />
                                  ),
                                }}
                              >
                                {generateModMarkdown(mod)}
                              </ReactMarkdown>
                            </div>
                          </div>

                          <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
                            {mod.download && (
                              <Button asChild>
                                <a href={mod.download} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-2 h-4 w-4" />
                                  다운로드
                                  <ExternalLink className="ml-2 h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
