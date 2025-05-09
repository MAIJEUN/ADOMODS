"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
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
  const { t } = useLanguage()
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
          placeholder={t("search.placeholder")}
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
            {sortBy === "uploadedTimestamp" && t("search.sortByLatest")}
            {sortBy === "name" && t("search.sortByName")}
            {sortBy === "version" && t("search.sortByVersion")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("search.sortBy")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sortBy} onValueChange={handleSortChange}>
            <DropdownMenuRadioItem value="uploadedTimestamp">{t("search.sortByLatest")}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="name">{t("search.sortByName")}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="version">{t("search.sortByVersion")}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Search className="h-4 w-4 mr-2 animate-spin" />
            {t("search.searching")}
          </>
        ) : (
          t("search.button")
        )}
      </Button>
    </form>
  )
}
