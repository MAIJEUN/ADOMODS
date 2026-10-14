"use client"

import { useCallback, useSyncExternalStore } from "react"

// Favorite mod IDs, stored only in this browser
const STORAGE_KEY = "adomods-favorites"
const EMPTY: ReadonlySet<string> = new Set()
const listeners = new Set<() => void>()
let current: ReadonlySet<string> | null = null

const read = (): ReadonlySet<string> => {
  if (current) return current
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
    current = new Set(Array.isArray(parsed) ? parsed.map(String) : [])
  } catch {
    current = new Set()
  }
  return current
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const toggleFavorite = (id: string) => {
  const next = new Set(read())
  if (next.has(id)) next.delete(id)
  else next.add(id)
  current = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
  } catch {
    // Not persisted; still applies for this page session
  }
  listeners.forEach((listener) => listener())
}

export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, read, () => EMPTY)
  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites])
  return { favorites, isFavorite, toggleFavorite }
}
