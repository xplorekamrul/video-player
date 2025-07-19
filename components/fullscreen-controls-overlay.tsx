"use client"

import { cn } from "@/lib/utils"
import { SkipForward, SkipBack } from "lucide-react"
import React from "react"

interface FullscreenControlsOverlayProps {
  isVisible: boolean
  seekDuration: number
  onDoubleClickLeft: () => void
  onDoubleClickRight: () => void
  className?: string
}

interface SeekZoneProps {
  position: "left" | "right"
  label: string
  icon: React.ReactNode
  isVisible: boolean
  onDoubleClick: () => void
}

/** Reusable SeekZone Component */
function SeekZone({ position, label, icon, isVisible, onDoubleClick }: SeekZoneProps) {
  return (
    <div
      tabIndex={0}
      role="button"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onDoubleClick()
        }
      }}
      className={cn(
        "absolute top-0 w-1/2 h-full transition-all duration-300 pointer-events-auto cursor-pointer focus:outline-none",
        position === "left"
          ? "left-0 bg-gradient-to-r"
          : "right-0 bg-gradient-to-l",
        isVisible ? "from-black/10 to-transparent" : "bg-transparent",
      )}
      onDoubleClick={onDoubleClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "flex items-center space-x-3 text-white/80 transition-all duration-300 transform",
            "bg-black/40 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/10",
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
          )}
        >
          {position === "left" && <div className="p-2 bg-white/10 rounded-full">{icon}</div>}
          <div className="text-center">
            <div className="font-semibold text-lg">Double-click</div>
            <div className="text-sm text-white/60">{label}</div>
          </div>
          {position === "right" && <div className="p-2 bg-white/10 rounded-full">{icon}</div>}
        </div>
      </div>
    </div>
  )
}

/** FullscreenControlsOverlay Component */
export function FullscreenControlsOverlay({
  isVisible,
  seekDuration,
  onDoubleClickLeft,
  onDoubleClickRight,
  className,
}: FullscreenControlsOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-[1000] transition-all duration-300",
        !isVisible ? "pointer-events-none opacity-0" : "pointer-events-auto opacity-100",
        className
      )}
    >

      {/* Left Seek Zone */}
      <SeekZone
        position="left"
        label={`Rewind ${seekDuration}s`}
        icon={<SkipBack className="h-6 w-6" />}
        isVisible={isVisible}
        onDoubleClick={onDoubleClickLeft}
      />

      {/* Right Seek Zone */}
      <SeekZone
        position="right"
        label={`Fast-forward ${seekDuration}s`}
        icon={<SkipForward className="h-6 w-6" />}
        isVisible={isVisible}
        onDoubleClick={onDoubleClickRight}
      />

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
