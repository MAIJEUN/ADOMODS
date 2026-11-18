"use client"

import { useId, useMemo, useState, type ReactNode, type RefObject } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronDown, Search, Star, X } from "lucide-react"
import { matchesQuery, toChosungKey } from "@/lib/hangul"
import type { Developer } from "@/lib/mods"
import { useT } from "@/lib/use-lang"
import { DeveloperAvatar } from "@/components/developer"

export const SORT_TYPES = ["newest", "oldest", "name-asc", "name-desc"] as const
export type SortType = (typeof SORT_TYPES)[number]

export interface FilterState {
  // Developer IDs (see getDeveloperId)
  developers?: string[]
  favoritesOnly?: boolean
}

export const countActiveFilters = (filters: FilterState) =>
  (filters.developers?.length ?? 0) + (filters.favoritesOnly ? 1 : 0)

// On/off filter shown as a button; aria-pressed tells assistive tech whether it's on
function ToggleChip({
  pressed,
  onToggle,
  icon,
  children,
}: {
  pressed: boolean
  onToggle: () => void
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={pressed}
      onClick={onToggle}
      className={
        pressed
          ? "border-foreground/40 bg-accent text-foreground hover:bg-accent"
          : "bg-transparent dark:bg-transparent [&_svg]:text-muted-foreground"
      }
    >
      {icon}
      {children}
    </Button>
  )
}

function DeveloperPicker({
  developers,
  selected,
  onToggle,
  onClear,
}: {
  developers: Developer[]
  selected: string[]
  onToggle: (id: string) => void
  onClear: () => void
}) {
  const { t } = useT()
  const [query, setQuery] = useState("")
  const listId = useId()

  // Selected developers stay on top so they're easy to find and uncheck
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = q
      ? developers.filter((dev) => matchesQuery(dev.name.toLowerCase(), toChosungKey(dev.name), q))
      : developers
    return [...matches.filter((dev) => selected.includes(dev.id)), ...matches.filter((dev) => !selected.includes(dev.id))]
  }, [developers, query, selected])

  const pressed = selected.length > 0

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={
            pressed
              ? "border-foreground/40 bg-accent text-foreground hover:bg-accent"
              : "bg-transparent dark:bg-transparent [&_svg]:text-muted-foreground"
          }
        >
          {pressed ? t("list.developersSelected", { n: selected.length }) : t("list.developer")}
          <ChevronDown className="opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b border-border p-2">
          <Input
            type="search"
            aria-label={t("list.developerSearch")}
            aria-controls={listId}
            placeholder={t("list.developerSearch")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <ul id={listId} aria-label={t("list.developer")} className="max-h-72 overflow-y-auto p-1">
          {shown.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">{t("list.noResults")}</li>}
          {shown.map((dev) => {
            const id = `${listId}-${dev.id}`
            return (
              <li key={dev.id}>
                <label
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <Checkbox id={id} checked={selected.includes(dev.id)} onCheckedChange={() => onToggle(dev.id)} />
                  <DeveloperAvatar mod={dev.avatarMod} />
                  <span className="min-w-0 flex-1 truncate">{dev.name}</span>
                  <span className="text-xs text-muted-foreground" aria-label={t("dev.modCount", { n: dev.modCount })}>
                    {dev.modCount}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
        {pressed && (
          <div className="border-t border-border p-2">
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onClear}>
              {t("list.clearDevelopers")}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function ModFilters({
  searchQuery,
  onSearchChange,
  searchInputRef,
  sortBy,
  onSortChange,
  filters,
  onFiltersChange,
  developers,
  favoritesCount,
}: {
  searchQuery: string
  onSearchChange: (value: string) => void
  searchInputRef: RefObject<HTMLInputElement | null>
  sortBy: SortType
  onSortChange: (value: SortType) => void
  filters: FilterState
  onFiltersChange: (update: (prev: FilterState) => FilterState) => void
  developers: Developer[]
  favoritesCount: number
}) {
  const { t } = useT()
  const sortLabelId = useId()
  const developersById = useMemo(() => new Map(developers.map((dev) => [dev.id, dev])), [developers])
  const selectedDevelopers = filters.developers ?? []
  const activeCount = countActiveFilters(filters)

  const toggleFavorites = () =>
    onFiltersChange((prev) => ({ ...prev, favoritesOnly: prev.favoritesOnly ? undefined : true }))

  const setDevelopers = (ids: string[]) =>
    onFiltersChange((prev) => ({ ...prev, developers: ids.length > 0 ? ids : undefined }))

  const toggleDeveloper = (id: string) =>
    setDevelopers(selectedDevelopers.includes(id) ? selectedDevelopers.filter((d) => d !== id) : [...selectedDevelopers, id])

  return (
    <div className="space-y-3">
      {/* Search, sort and quick filters on one row (the search box takes its own row on phones) */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="search" className="relative w-full sm:w-auto sm:min-w-64 sm:flex-1">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            inputMode="search"
            aria-label={t("list.searchLabel")}
            aria-keyshortcuts="/"
            placeholder={t("list.search")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && searchQuery && onSearchChange("")}
            className="pl-10 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label={t("list.clearSearch")}
              onClick={() => {
                onSearchChange("")
                searchInputRef.current?.focus()
              }}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <span id={sortLabelId} className="sr-only">
          {t("list.sort")}
        </span>
        <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortType)}>
          <SelectTrigger aria-labelledby={sortLabelId} className="w-auto min-w-28 gap-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("sort.newest")}</SelectItem>
            <SelectItem value="oldest">{t("sort.oldest")}</SelectItem>
            <SelectItem value="name-asc">{t("sort.nameAsc")}</SelectItem>
            <SelectItem value="name-desc">{t("sort.nameDesc")}</SelectItem>
          </SelectContent>
        </Select>

        <div role="group" aria-label={t("list.quickFilters")} className="contents">
          <ToggleChip
            pressed={!!filters.favoritesOnly}
            onToggle={toggleFavorites}
            icon={<Star className={filters.favoritesOnly ? "fill-current" : ""} />}
          >
            {t("list.favorites")}
            {favoritesCount > 0 && <span className="text-xs text-muted-foreground">{favoritesCount}</span>}
          </ToggleChip>
          <DeveloperPicker
            developers={developers}
            selected={selectedDevelopers}
            onToggle={toggleDeveloper}
            onClear={() => setDevelopers([])}
          />
          {activeCount > 0 && (
            <Button type="button" variant="ghost" onClick={() => onFiltersChange(() => ({}))}>
              <X />
              {t("list.resetFilters")}
            </Button>
          )}
        </div>
      </div>

      {/* Selected developers, each removable on its own */}
      {selectedDevelopers.length > 0 && (
        <ul aria-label={t("list.developer")} className="flex flex-wrap items-center gap-2">
          {selectedDevelopers.map((id) => {
            const dev = developersById.get(id)
            const name = dev?.name ?? id
            return (
              <li key={id}>
                <Badge variant="secondary" className="gap-1.5 py-1 pl-1.5 pr-1">
                  {dev && <DeveloperAvatar mod={dev.avatarMod} />}
                  {name}
                  <button
                    type="button"
                    aria-label={t("list.removeFilterNamed", { name })}
                    onClick={() => toggleDeveloper(id)}
                    className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
