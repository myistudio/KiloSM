"use client"

import React, { useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

type FitTextProps = {
  children: React.ReactNode
  minPx?: number
  maxPx?: number
  className?: string
}

export default function FitText({ children, minPx = 12, maxPx = 40, className }: FitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState<number>(maxPx)

  useLayoutEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const fit = () => {
      let lo = Math.max(8, Math.floor(minPx))
      let hi = Math.max(lo, Math.floor(maxPx))
      let best = lo

      content.style.whiteSpace = "nowrap"
      content.style.display = "inline-block"
      content.style.wordBreak = "keep-all"

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2)
        content.style.fontSize = `${mid}px`
        const fits = content.scrollWidth <= container.clientWidth
        if (fits) {
          best = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }

      setSize(best)
    }

    fit()

    const ro = new ResizeObserver(() => fit())
    ro.observe(container)
    return () => {
      ro.disconnect()
    }
  }, [minPx, maxPx, children])

  return (
    <div ref={containerRef} className={cn("w-full min-w-0 overflow-hidden whitespace-nowrap text-center", className)}>
      <span
        ref={contentRef}
        style={{ fontSize: `${size}px`, lineHeight: 1, wordBreak: "keep-all", whiteSpace: "nowrap" }}
      >
        {children}
      </span>
    </div>
  )
}