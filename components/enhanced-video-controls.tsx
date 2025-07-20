"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  SkipForward,
  SkipBack,
  PictureInPicture,
  Monitor,
  Sun,
  List,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/tooltip"
import { cn } from "@/lib/utils"

interface EnhancedVideoControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  playbackRate: number
  isPiP: boolean
  brightness: number
  theaterMode: boolean
  currentQuality: string
  buffered: TimeRanges | null
  isMetadataLoaded: boolean
  seekDuration: number
  showControls: boolean
  hasPlaylist: boolean
  canGoNext: boolean
  canGoPrevious: boolean
  onPlay: () => void
  onPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
  onPlaybackRateChange: (rate: number) => void
  onTogglePiP: () => void
  onBrightnessChange: (brightness: number) => void
  onToggleTheater: () => void
  onSkipForward: () => void
  onSkipBackward: () => void
  onNextVideo: () => void
  onPreviousVideo: () => void
  onOpenSettings: () => void
  onOpenPlaylist: () => void
  onSeekDurationChange: (duration: number) => void
  onVolumeOverlayShow: () => void
  onBrightnessOverlayShow: () => void
}

export function EnhancedVideoControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isFullscreen,
  playbackRate,
  isPiP,
  brightness,
  theaterMode,
  currentQuality,
  buffered,
  isMetadataLoaded,
  seekDuration,
  showControls,
  hasPlaylist,
  canGoNext,
  canGoPrevious,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onPlaybackRateChange,
  onTogglePiP,
  onBrightnessChange,
  onToggleTheater,
  onSkipForward,
  onSkipBackward,
  onNextVideo,
  onPreviousVideo,
  onOpenSettings,
  onOpenPlaylist,
  onSeekDurationChange,
  onVolumeOverlayShow,
  onBrightnessOverlayShow,
}: EnhancedVideoControlsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const brightnessTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const formatTime = useCallback((time: number) => {
    if (!isFinite(time)) return "0:00"
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      : `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  const getBufferedPercentage = useCallback(() => {
    if (!buffered || !duration || duration === 0) return 0
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
        return (buffered.end(i) / duration) * 100
      }
    }
    return 0
  }, [buffered, currentTime, duration])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (progressRef.current && duration > 0) {
        const rect = progressRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const percentage = Math.max(0, Math.min(clickX / rect.width, 1))
        const newTime = percentage * duration
        onSeek(newTime)
      }
    },
    [duration, onSeek]
  )

  const handleProgressMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (progressRef.current && duration > 0) {
        const rect = progressRef.current.getBoundingClientRect()
        const hoverX = e.clientX - rect.left
        const percentage = Math.max(0, Math.min(hoverX / rect.width, 1))
        const time = percentage * duration
        setPreviewTime(time)
        if (isDragging) {
          onSeek(time)
        }
      }
    },
    [duration, isDragging, onSeek]
  )

  const handleProgressMouseLeave = useCallback(() => {
    setPreviewTime(null)
  }, [])

  const handleProgressKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault()
        const step = duration / 100
        const newTime = e.key === "ArrowLeft"
          ? Math.max(0, currentTime - step)
          : Math.min(duration, currentTime + step)
        onSeek(newTime)
      }
    },
    [currentTime, duration, onSeek]
  )

  const handleVolumeSliderShow = useCallback(() => {
    clearTimeout(volumeTimeoutRef.current!)
    setShowVolumeSlider(true)
  }, [])

  const handleVolumeSliderHide = useCallback(() => {
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false)
    }, 500)
  }, [])

  const handleBrightnessSliderShow = useCallback(() => {
    clearTimeout(brightnessTimeoutRef.current!)
    setShowBrightnessSlider(true)
  }, [])

  const handleBrightnessSliderHide = useCallback(() => {
    brightnessTimeoutRef.current = setTimeout(() => {
      setShowBrightnessSlider(false)
    }, 500)
  }, [])

  const handleVolumeChangeWithOverlay = useCallback(
    (newVolume: number) => {
      onVolumeChange(newVolume)
      onVolumeOverlayShow()
    },
    [onVolumeChange, onVolumeOverlayShow]
  )

  const handleBrightnessChangeWithOverlay = useCallback(
    (newBrightness: number) => {
      onBrightnessChange(newBrightness)
      onBrightnessOverlayShow()
    },
    [onBrightnessChange, onBrightnessOverlayShow]
  )

  const handleMuteToggleWithOverlay = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onToggleMute()
      onVolumeOverlayShow()
    },
    [onToggleMute, onVolumeOverlayShow]
  )

  const handleNextVideo = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (canGoNext && !isNavigating) {
        setIsNavigating(true)
        onNextVideo()
        clearTimeout(navigationTimeoutRef.current!)
        navigationTimeoutRef.current = setTimeout(() => {
          setIsNavigating(false)
        }, 1000)
      }
    },
    [canGoNext, isNavigating, onNextVideo]
  )

  const handlePreviousVideo = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (canGoPrevious && !isNavigating) {
        setIsNavigating(true)
        onPreviousVideo()
        clearTimeout(navigationTimeoutRef.current!)
        navigationTimeoutRef.current = setTimeout(() => {
          setIsNavigating(false)
        }, 1000)
      }
    },
    [canGoPrevious, isNavigating, onPreviousVideo]
  )

  const handleControlClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  const getTooltipContent = useMemo(
    () => (action: string, shortcut?: string) => {
      const shortcuts: Record<string, string> = {
        play: "Space, K, Enter",
        pause: "Space, K, Enter",
        skipBack: "←, J, H",
        skipForward: "→, L, ;",
        previous: "B, Page Up",
        next: "N, Page Down",
        volume: "↑↓, +-, M to mute",
        brightness: "Adjust display brightness",
        playlist: "View playlist",
        pip: "P, I",
        theater: "T, W",
        settings: "S, O",
        fullscreen: "F, F11",
      }
      const shortcutText = shortcut || shortcuts[action.toLowerCase()] || ""
      return shortcutText ? `${action} (${shortcutText})` : action
    },
    []
  )

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false)
    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp)
      return () => document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  useEffect(() => {
    return () => {
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current)
      if (brightnessTimeoutRef.current) clearTimeout(brightnessTimeoutRef.current)
      if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current)
    }
  }, [])

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercentage = getBufferedPercentage()

  return (
    <TooltipProvider delayDuration={isFullscreen ? 100 : 300}>
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end transition-all duration-500 ease-out",
          isFullscreen
            ? "bg-gradient-to-t from-black/95 via-black/50 to-transparent"
            : "bg-gradient-to-t from-black/80 via-transparent to-transparent"
        )}
        onClick={handleControlClick}
      >
        <div className={cn("px-4 pb-2 transition-all duration-500 ease-out", isFullscreen && "px-4 pb-2")}>
          <div
            ref={progressRef}
            className={cn(
              "relative bg-white/20 rounded-full cursor-pointer group transition-all duration-300 ease-out",
              isFullscreen ? "h-2" : "h-2",
              "hover:h-3 hover:bg-white/30"
            )}
            onClick={handleProgressClick}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            onMouseDown={(e) => {
              e.stopPropagation()
              setIsDragging(true)
            }}
            onKeyDown={handleProgressKeyDown}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={duration || 0}
            aria-valuenow={currentTime}
            tabIndex={0}
          >
            <div
              className="absolute top-0 left-0 h-full bg-white/40 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${bufferedPercentage}%` }}
            />
            <div
              className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 bg-red-500 rounded-full transition-all duration-200 ease-out cursor-grab active:cursor-grabbing",
                isFullscreen ? "w-6 h-6" : "w-4 h-4",
                "opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100"
              )}
              style={{ left: `calc(${progressPercentage}% - ${isFullscreen ? "12px" : "8px"})` }}
            />
            {previewTime !== null && duration > 0 && (
              <div
                className={cn(
                  "absolute bottom-full mb-3 px-4 py-2 bg-black/90 text-white rounded-lg whitespace-nowrap backdrop-blur-md border border-white/20",
                  isFullscreen && "text-lg px-6 py-3"
                )}
                style={{
                  left: `calc(${(previewTime / duration) * 100}% - 40px)`,
                  transform: "translateX(-50%)",
                }}
              >
                {formatTime(previewTime)}
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-between gap-4 transition-all duration-500 ease-out",
            "bg-gradient-to-t from-black/80 via-black/50 to-transparent",
            "backdrop-blur-md border-t border-white/20 px-4 py-3",
          )}
        >
          <div className="flex items-center space-x-3">

            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isFullscreen ? "lg" : "sm"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSkipBackward()
                  }}
                  className="text-white hover:bg-white/20 transition-all duration-200"
                  aria-label={`Skip backward ${seekDuration} seconds`}
                >
                  <SkipBack className={cn("h-5 w-5")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent >
                {getTooltipContent("Skip backward", `${seekDuration}s`)}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isFullscreen ? "sm" : "sm"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSkipForward()
                  }}
                  className="text-white hover:bg-white/20 transition-all duration-200"
                  aria-label={`Skip forward ${seekDuration} seconds`}
                >
                  <SkipForward className={cn("h-5 w-5")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent >
                {getTooltipContent("Skip forward", `${seekDuration}s`)}
              </TooltipContent>
            </Tooltip> */}

            {hasPlaylist && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={isFullscreen ? "lg" : "sm"}
                    onClick={handlePreviousVideo}
                    disabled={!canGoPrevious || isNavigating}
                    className={cn(
                      "text-white hover:bg-white/20 transition-all duration-200 border border-white/20 backdrop-blur-md",
                      (!canGoPrevious || isNavigating) && "opacity-50 cursor-not-allowed",
                      isFullscreen && "px-5 py-3",
                      isNavigating && "animate-pulse"
                    )}
                    aria-label="Previous video in playlist"
                  >
                    <SkipBack className={cn("h-5 w-5")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent >
                  {getTooltipContent("Previous video")}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isFullscreen ? "sm" : "sm"}
                  onClick={(e) => {
                    e.stopPropagation()
                    isPlaying ? onPause() : onPlay()
                  }}
                  className="text-white hover:bg-white/20 transition-all duration-200"
                  aria-label={isPlaying ? "Pause" : "Play"}
                  aria-pressed={isPlaying}
                >
                  {isPlaying ? (
                    <Pause className={cn("h-6 w-6", isFullscreen && "h-6 w-6")} />
                  ) : (
                    <Play className={cn("h-6 w-6", isFullscreen && "h-6 w-6")} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent >
                {getTooltipContent(isPlaying ? "Pause" : "Play")}
              </TooltipContent>
            </Tooltip>


            {hasPlaylist && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={isFullscreen ? "lg" : "sm"}
                    onClick={handleNextVideo}
                    disabled={!canGoNext || isNavigating}
                    className={cn(
                      "text-white hover:bg-white/20 transition-all duration-200 border border-white/20 backdrop-blur-md",
                      (!canGoNext || isNavigating) && "opacity-50 cursor-not-allowed",
                      isFullscreen && "px-5 py-3",
                      isNavigating && "animate-pulse"
                    )}
                    aria-label="Next video in playlist"
                  >
                    <SkipForward className={cn("h-5 w-5")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent >
                  {getTooltipContent("Next video")}
                </TooltipContent>
              </Tooltip>
            )}

            <div
              className="relative flex items-center group"
              onMouseEnter={handleVolumeSliderShow}
              onMouseLeave={handleVolumeSliderHide}
            >
              <div className="flex items-center space-x-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size={isFullscreen ? "lg" : "sm"}
                      onClick={handleMuteToggleWithOverlay}
                      className="text-white hover:bg-white/20 transition-all duration-200"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                      aria-pressed={isMuted}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className={cn("h-5 w-5")} />
                      ) : (
                        <Volume2 className={cn("h-5 w-5")} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent >
                    {getTooltipContent(isMuted ? "Unmute" : "Mute", `${Math.round(volume * 100)}%`)}
                  </TooltipContent>
                </Tooltip>

                <div
                  className={cn(
                    "transition-all duration-300 ease-out overflow-hidden",
                    showVolumeSlider ? (isFullscreen ? "w-40 opacity-100" : "w-24 opacity-100") : "w-0 opacity-0"
                  )}
                >
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    onValueChange={(value) => handleVolumeChangeWithOverlay(value[0] / 100)}
                    max={100}
                    step={1}
                    className="w-full"
                    aria-label="Volume"
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault()
                        const newVolume = e.key === "ArrowUp"
                          ? Math.min(volume + 0.05, 1)
                          : Math.max(volume - 0.05, 0)
                        handleVolumeChangeWithOverlay(newVolume)
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <span
              className={cn(
                "text-white tabular-nums transition-all duration-200",
                isFullscreen ? "text-lg" : "text-sm"
              )}
            >
              {formatTime(currentTime)} / {formatTime(duration || 0)}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className="relative flex items-center group"
              onMouseEnter={handleBrightnessSliderShow}
              onMouseLeave={handleBrightnessSliderHide}
            >
              <div className="flex items-center space-x-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size={isFullscreen ? "lg" : "sm"}
                      className="text-white hover:bg-white/20 transition-all duration-200"
                      aria-label="Brightness control"
                      onClick={handleControlClick}
                    >
                      <Sun className={cn("h-5 w-5")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent >
                    {getTooltipContent("Brightness", `${brightness}%`)}
                  </TooltipContent>
                </Tooltip>

                <div
                  className={cn(
                    "transition-all duration-300 ease-out overflow-hidden",
                    showBrightnessSlider ? (isFullscreen ? "w-40 opacity-100" : "w-24 opacity-100") : "w-0 opacity-0"
                  )}
                >
                  <Slider
                    value={[brightness]}
                    onValueChange={(value) => handleBrightnessChangeWithOverlay(value[0])}
                    min={25}
                    max={200}
                    step={5}
                    className="w-full"
                    aria-label="Brightness"
                    onKeyDown={(e) => {
                      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                        e.preventDefault()
                        const newBrightness = e.key === "ArrowUp"
                          ? Math.min(brightness + 5, 200)
                          : Math.max(brightness - 5, 25)
                        handleBrightnessChangeWithOverlay(newBrightness)
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {hasPlaylist && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={isFullscreen ? "lg" : "sm"}
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenPlaylist()
                    }}
                    className="text-white hover:bg-white/20 transition-all duration-200"
                    aria-label="Open playlist"
                  >
                    <List className={cn("h-5 w-5")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent >
                  {getTooltipContent("Open playlist")}
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isFullscreen ? "lg" : "sm"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTogglePiP()
                  }}
                  className={cn(
                    "text-white hover:bg-white/20 transition-all duration-200",
                    !isMetadataLoaded && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={!isMetadataLoaded}
                  aria-label="Picture in Picture"
                  aria-pressed={isPiP}
                >
                  <PictureInPicture className={cn("h-5 w-5")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent >
                {getTooltipContent("Picture in Picture")}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isFullscreen ? "lg" : "sm"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleTheater()
                  }}
                  className="text-white hover:bg-white/20 transition-all duration-200"
                  aria-label="Toggle theater mode"
                  aria-pressed={theaterMode}
                >
                  <Monitor className={cn("h-5 w-5")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent >
                {getTooltipContent("Theater mode")}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isFullscreen ? "lg" : "sm"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenSettings()
                  }}
                  className={cn(
                    "text-white hover:bg-white/20 transition-all duration-200 border border-white/20 backdrop-blur-md",
                    isFullscreen && "px-5 py-3"
                  )}
                  aria-label="Open settings"
                >
                  <Settings className={cn("h-5 w-5")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent >
                {getTooltipContent("Settings")}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={isFullscreen ? "lg" : "sm"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleFullscreen()
                  }}
                  className="text-white hover:bg-white/20 transition-all duration-200"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  aria-pressed={isFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize className={cn("h-5 w-5")} />
                  ) : (
                    <Maximize className={cn("h-5 w-5")} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent >
                {getTooltipContent(isFullscreen ? "Exit fullscreen" : "Enter fullscreen")}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}