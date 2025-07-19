"use client"

import { cn } from "@/lib/utils"
import { SkipForward, SkipBack } from "lucide-react"

interface FullscreenControlsOverlayProps {
  isVisible: boolean
  seekDuration: number
  onDoubleClickLeft: () => void
  onDoubleClickRight: () => void
  className?: string
}

export function FullscreenControlsOverlay({
  isVisible,
  seekDuration,
  onDoubleClickLeft,
  onDoubleClickRight,
  className,
}: FullscreenControlsOverlayProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Left Seek Zone */}
      <div
        className={cn(
          "absolute left-0 top-0 w-1/2 h-full transition-all duration-300 pointer-events-auto cursor-pointer",
          isVisible ? "bg-gradient-to-r from-black/10 to-transparent" : "bg-transparent",
        )}
        onDoubleClick={onDoubleClickLeft}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "flex items-center space-x-3 text-white/80 transition-all duration-300 transform",
              "bg-black/40 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/10",
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
            )}
          >
            <div className="p-2 bg-white/10 rounded-full">
              <SkipBack className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">Double-click</div>
              <div className="text-sm text-white/60">Rewind {seekDuration}s</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Seek Zone */}
      <div
        className={cn(
          "absolute right-0 top-0 w-1/2 h-full transition-all duration-300 pointer-events-auto cursor-pointer",
          isVisible ? "bg-gradient-to-l from-black/10 to-transparent" : "bg-transparent",
        )}
        onDoubleClick={onDoubleClickRight}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "flex items-center space-x-3 text-white/80 transition-all duration-300 transform",
              "bg-black/40 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/10",
              isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
            )}
          >
            <div className="text-center">
              <div className="font-semibold text-lg">Double-click</div>
              <div className="text-sm text-white/60">Fast-forward {seekDuration}s</div>
            </div>
            <div className="p-2 bg-white/10 rounded-full">
              <SkipForward className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Center Play/Pause Zone */}
      <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 flex items-center justify-center">
        <div
          className={cn(
            "text-white/60 transition-all duration-300 transform",
            "bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/5",
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
          )}
        >
          <div className="text-center">
            <div className="text-sm font-medium">Single-click to play/pause</div>
            <div className="text-xs text-white/40 mt-1">Move cursor to show controls</div>
          </div>
        </div>
      </div>

      
    </div>
  )
}
