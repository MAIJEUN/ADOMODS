"use client"

import { useState, useMemo, useEffect } from "react"
import useSWR from "swr"
import ReactMarkdown from "react-markdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Search,
  Download,
  ExternalLink,
  Loader2,
  Info,
  User,
  Calendar,
  Hash,
  Filter,
  X,
  MessageSquare,
} from "lucide-react"

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
  imageURL?: string
  [key: string]: any
}

type SortType = "newest" | "oldest" | "name-asc" | "name-desc"

interface FilterState {
  developers?: string[]
  hasDownload?: boolean
}

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

  if (mod.download) {
    sections.push(`\n## 다운로드\n[다운로드 링크](${mod.download})`)
  }

  return sections.join("\n")
}

const getDiscordMessageUrl = (mod: Mod) => {
  if (mod.guild && mod.channel && mod.message) {
    return `https://discord.com/channels/${mod.guild}/${mod.channel}/${mod.message}`
  }
  return null
}

const cleanImageUrl = (url?: string) => {
  if (!url) return "/placeholder.svg"
  // Remove trailing & or ? from URL
  return url.replace(/[&?]+$/, "")
}

export default function ModsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedMod, setSelectedMod] = useState<Mod | null>(null)
  const [filters, setFilters] = useState<FilterState>({})
  const [developerSearch, setDeveloperSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data, error, isLoading } = useSWR("/api/mods", fetcher, {
    revalidateOnFocus: false,
  })

  const modsArray = Array.isArray(data) ? data : data?.mods || data?.data || []

  const uniqueDevelopers = useMemo(() => {
    const developers = modsArray
      .filter((mod: Mod) => mod.version && mod.cachedUsername)
      .map((mod: Mod) => mod.cachedUsername)
      .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
      .sort()
    return developers
  }, [modsArray])

  const filteredDevelopers = useMemo(() => {
    if (!developerSearch) return uniqueDevelopers
    const query = developerSearch.toLowerCase()
    return uniqueDevelopers.filter((dev: string) => dev.toLowerCase().includes(query))
  }, [uniqueDevelopers, developerSearch])

  const filteredAndSortedMods = useMemo(() => {
    return modsArray
      .filter((mod: Mod) => mod.version)
      .filter((mod: Mod) => {
        if (filters.developers && filters.developers.length > 0) {
          if (!filters.developers.includes(mod.cachedUsername || "")) {
            return false
          }
        }
        if (filters.hasDownload && !mod.download) {
          return false
        }
        return true
      })
      .filter((mod: Mod) => {
        const query = debouncedSearch.toLowerCase()
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
  }, [modsArray, filters, debouncedSearch, sortBy])

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true),
  ).length

  const toggleDeveloper = (developer: string) => {
    setFilters((prev) => {
      const current = prev.developers || []
      if (current.includes(developer)) {
        const updated = current.filter((d) => d !== developer)
        return { ...prev, developers: updated.length > 0 ? updated : undefined }
      } else {
        return { ...prev, developers: [...current, developer] }
      }
    })
  }

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

        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                필터
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">필터</h4>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
                      모두 지우기
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    개발자 {filters.developers && filters.developers.length > 0 && `(${filters.developers.length})`}
                  </label>
                  <Input
                    type="text"
                    placeholder="개발자 검색..."
                    value={developerSearch}
                    onChange={(e) => setDeveloperSearch(e.target.value)}
                    className="mb-2"
                  />
                  <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-2">
                    {filteredDevelopers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">검색 결과가 없습니다</p>
                    ) : (
                      filteredDevelopers.map((dev: string) => (
                        <div key={dev} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dev-${dev}`}
                            checked={filters.developers?.includes(dev) || false}
                            onCheckedChange={() => toggleDeveloper(dev)}
                          />
                          <label
                            htmlFor={`dev-${dev}`}
                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {dev}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">다운로드 가능 여부</label>
                  <Select
                    value={filters.hasDownload ? "yes" : "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        hasDownload: value === "yes" ? true : undefined,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">모두 표시</SelectItem>
                      <SelectItem value="yes">다운로드 가능한 모드만</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

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

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">활성 필터:</span>
          {filters.developers && filters.developers.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              개발자: {filters.developers.join(", ")}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, developers: undefined }))}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.hasDownload && (
            <Badge variant="secondary" className="gap-1">
              다운로드 가능
              <button
                onClick={() => setFilters((prev) => ({ ...prev, hasDownload: undefined }))}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

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
                    {mod.description && (
                      <CardDescription className="line-clamp-2">
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }) => <span {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                            em: ({ node, ...props }) => <em {...props} />,
                            code: ({ node, ...props }) => (
                              <code className="bg-muted px-1 py-0.5 rounded text-xs" {...props} />
                            ),
                            img: ({ node, ...props }) => (
                              <img
                                className="max-w-full h-auto rounded-lg my-4 border border-border"
                                {...props}
                                alt={props.alt || "이미지"}
                              />
                            ),
                          }}
                        >
                          {mod.description}
                        </ReactMarkdown>
                      </CardDescription>
                    )}
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
                        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col">
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
                                  ol: ({ node, ...props }) => (
                                    <ol className="list-decimal pl-6 mb-2 space-y-1" {...props} />
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
                                  img: ({ node, ...props }) => (
                                    <img
                                      {...props}
                                      alt={props.alt || "이미지"}
                                      className="max-w-full h-auto rounded-lg border border-border my-4"
                                    />
                                  ),
                                }}
                              >
                                {generateModMarkdown(mod)}
                              </ReactMarkdown>

                              {mod.imageURL && (
                                <div className="mt-6 pt-6 border-t border-border">
                                  <h3 className="text-lg font-semibold mb-3">📷 참고 이미지</h3>
                                  <div className="relative w-full">
                                    <img
                                      src={cleanImageUrl(mod.imageURL) || "/placeholder.svg"}
                                      alt={`${mod.name} 참고 이미지`}
                                      className="max-w-full h-auto rounded-lg border border-border shadow-sm"
                                      crossOrigin="anonymous"
                                      onError={(e) => {
                                        console.log("[v0] Image failed to load:", mod.imageURL)
                                        const target = e.currentTarget as HTMLImageElement
                                        target.style.display = "none"
                                        const parent = target.parentElement
                                        if (parent) {
                                          const errorMsg = document.createElement("p")
                                          errorMsg.className = "text-sm text-muted-foreground"
                                          errorMsg.textContent = "이미지를 불러올 수 없습니다."
                                          parent.appendChild(errorMsg)
                                        }
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <DialogFooter className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t">
                            {getDiscordMessageUrl(mod) && (
                              <Button variant="outline" asChild>
                                <a href={getDiscordMessageUrl(mod)!} target="_blank" rel="noopener noreferrer">
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  디스코드 메시지로 이동
                                  <ExternalLink className="ml-2 h-3 w-3" />
                                </a>
                              </Button>
                            )}
                            {mod.download && (
                              <Button asChild>
                                <a href={mod.download} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-2 h-4 w-4" />
                                  다운로드
                                  <ExternalLink className="ml-2 h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </DialogFooter>
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
