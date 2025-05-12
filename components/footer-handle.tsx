"use client"

import type React from "react"

import { useState } from "react"

interface FooterHandleProps {
  isExpanded: boolean
  toggleExpanded: () => void
}

export function FooterHandle({ isExpanded, toggleExpanded }: FooterHandleProps) {
  const [touchStartY, setTouchStartY] = useState<number | null>(null)

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return

    const touchEndY = e.changedTouches[0].clientY
    const diff = touchStartY - touchEndY

    // 위로 스와이프하면 펼치고, 아래로 스와이프하면 접기
    if (Math.abs(diff) > 10) {
      // 10px 이상 움직였을 때만 반응
      if (diff > 0 && !isExpanded) {
        toggleExpanded()
      } else if (diff < 0 && isExpanded) {
        toggleExpanded()
      }
    }

    setTouchStartY(null)
  }

  return (
    <div
      className="h-2 w-full bg-primary/10 cursor-pointer flex justify-center items-center"
      onClick={toggleExpanded}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-16 h-1 rounded-full bg-primary/20"></div>
    </div>
  )
}
