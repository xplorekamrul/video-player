"use client"

import { useEffect } from "react"
import { Volume2, VolumeX, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface VolumeBrightnessOverlayProps {
  volume: number
  brightness: number
  isMuted: boolean
  showVolumeOverlay: boolean
  showBrightnessOverlay: boolean
  onVolumeOverlayHide: () => void
  onBrightnessOverlayHide: () => void
}

export function VolumeBrightnessOverlay({
  volume,
  brightness,
  isMuted,
  showVolumeOverlay,
  showBrightnessOverlay,
  onVolumeOverlayHide,
  onBrightnessOverlayHide,
}: VolumeBrightnessOverlayProps) {
  useEffect(() => {
    if (showVolumeOverlay) {
      const timer = setTimeout(() => {
        onVolumeOverlayHide()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [showVolumeOverlay, onVolumeOverlayHide])

  useEffect(() => {
    if (showBrightnessOverlay) {
      const timer = setTimeout(() => {
        onBrightnessOverlayHide()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [showBrightnessOverlay, onBrightnessOverlayHide])

  if (!showVolumeOverlay && !showBrightnessOverlay) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
      {/* Volume Overlay */}
      {showVolumeOverlay && (
        <div
          className={cn(
            "bg-black/80 text-white px-8 py-6 rounded-2xl backdrop-blur-md border border-white/20",
            "animate-in fade-in-0 zoom-in-95 duration-300",
            "flex items-center space-x-4 min-w-[200px]",
          )}
        >
          <div className="p-3 bg-white/10 rounded-full">
            {isMuted || volume === 0 ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold mb-2">
              {isMuted ? "Muted" : `Volume ${Math.round(volume * 100)}%`}
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-200"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Brightness Overlay */}
      {showBrightnessOverlay && (
        <div
          className={cn(
            "bg-black/80 text-white px-8 py-6 rounded-2xl backdrop-blur-md border border-white/20",
            "animate-in fade-in-0 zoom-in-95 duration-300",
            "flex items-center space-x-4 min-w-[200px]",
          )}
        >
          <div className="p-3 bg-white/10 rounded-full">
            <Sun className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold mb-2">Brightness {brightness}%</div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-200"
                style={{ width: `${(brightness / 200) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
