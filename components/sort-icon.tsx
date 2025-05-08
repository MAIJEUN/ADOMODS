import { ArrowDown, ArrowUp, SortAsc } from "lucide-react"

interface SortIconProps {
  sort: string
}

export function SortIcon({ sort }: SortIconProps) {
  switch (sort) {
    case "uploadedTimestamp":
      return <ArrowDown className="h-3 w-3 ml-1" />
    case "name":
      return <SortAsc className="h-3 w-3 ml-1" />
    case "version":
      return <ArrowUp className="h-3 w-3 ml-1" />
    default:
      return null
  }
}
