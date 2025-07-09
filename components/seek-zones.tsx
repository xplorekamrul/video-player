"use client"

import { cn } from "@/lib/utils"

interface SeekZonesProps {
  isVisible: boolean
  className?: string
}

export function SeekZones({ isVisible, className }: SeekZonesProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Left Seek Zone */}
      <div
        className={cn(
          "absolute left-0 top-0 w-1/2 h-full transition-all duration-200",
          isVisible ? "bg-white/5 border-r border-white/10" : "bg-transparent",
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "flex items-center space-x-2 text-white/70 transition-opacity duration-200",
              isVisible ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="text-2xl">⏪</div>
            <span className="text-sm font-medium">Double-click to rewind</span>
          </div>
        </div>
      </div>

      {/* Right Seek Zone */}
      <div
        className={cn(
          "absolute right-0 top-0 w-1/2 h-full transition-all duration-200",
          isVisible ? "bg-white/5 border-l border-white/10" : "bg-transparent",
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "flex items-center space-x-2 text-white/70 transition-opacity duration-200",
              isVisible ? "opacity-100" : "opacity-0",
            )}
          >
            <span className="text-sm font-medium">Double-click to fast-forward</span>
            <div className="text-2xl">⏩</div>
          </div>
        </div>
      </div>
    </div>
  )
}
