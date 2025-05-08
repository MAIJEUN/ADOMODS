"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SearchBarProps {
  initialQuery?: string
  initialSort?: string
}

export default function SearchBar({ initialQuery = "", initialSort = "uploadedTimestamp" }: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [sortBy, setSortBy] = useState(initialSort)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 초기 값이 변경되면 상태 업데이트
  useEffect(() => {
    setSearchQuery(initialQuery)
    setSortBy(initialSort)
  }, [initialQuery, initialSort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (sortBy) params.set("sort", sortBy)

    router.push(`${pathname}?${params.toString()}`)

    // 상태 업데이트 후 제출 상태 초기화
    setTimeout(() => setIsSubmitting(false), 500)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    setIsSubmitting(true)

    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    params.set("sort", value)

    router.push(`${pathname}?${params.toString()}`)

    // 상태 업데이트 후 제출 상태 초기화
    setTimeout(() => setIsSubmitting(false), 500)
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="모드 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          disabled={isSubmitting}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" type="button" disabled={isSubmitting}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {sortBy === "uploadedTimestamp" && "최신순"}
            {sortBy === "name" && "이름순"}
            {sortBy === "version" && "버전순"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>정렬 기준</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sortBy} onValueChange={handleSortChange}>
            <DropdownMenuRadioItem value="uploadedTimestamp">최신순</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name">이름순</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="version">버전순</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Search className="h-4 w-4 mr-2 animate-spin" />
            검색 중...
          </>
        ) : (
          "검색"
        )}
      </Button>
    </form>
  )
}
