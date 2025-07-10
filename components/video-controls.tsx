"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface VideoControlsProps {
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
}

export function VideoControls({
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
}: VideoControlsProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false)
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const volumeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const brightnessTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const formatTime = useCallback((time: number) => {
    if (!isFinite(time)) return "0:00"

    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
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
      if (progressRef.current && duration > 0) {
        const rect = progressRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left
        const percentage = Math.max(0, Math.min(clickX / rect.width, 1))
        const newTime = percentage * duration
        onSeek(newTime)
      }
    },
    [duration, onSeek],
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
    [duration, isDragging, onSeek],
  )

  const handleProgressMouseLeave = useCallback(() => {
    setPreviewTime(null)
  }, [])

  const handleVolumeSliderShow = useCallback(() => {
    clearTimeout(volumeTimeoutRef.current)
    setShowVolumeSlider(true)
  }, [])

  const handleVolumeSliderHide = useCallback(() => {
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false)
    }, 500)
  }, [])

  const handleBrightnessSliderShow = useCallback(() => {
    clearTimeout(brightnessTimeoutRef.current)
    setShowBrightnessSlider(true)
  }, [])

  const handleBrightnessSliderHide = useCallback(() => {
    brightnessTimeoutRef.current = setTimeout(() => {
      setShowBrightnessSlider(false)
    }, 500)
  }, [])

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp)
      return () => document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercentage = getBufferedPercentage()

  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col justify-end transition-all duration-500 ease-out",
        isFullscreen
          ? "bg-gradient-to-t from-black/95 via-black/30 to-transparent"
          : "bg-gradient-to-t from-black/80 via-transparent to-transparent",
      )}
    >
      {/* Progress Bar - Enhanced with smooth animations */}
      <div className={cn("px-4 pb-2 transition-all duration-500 ease-out", isFullscreen && "px-8 pb-4")}>
        <div
          ref={progressRef}
          className={cn(
            "relative bg-white/20 rounded-full cursor-pointer group transition-all duration-300 ease-out",
            isFullscreen ? "h-3" : "h-2",
            "hover:h-3 hover:bg-white/25",
          )}
          onClick={handleProgressClick}
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={handleProgressMouseLeave}
          onMouseDown={() => setIsDragging(true)}
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
          tabIndex={0}
        >
          {/* Buffered Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${bufferedPercentage}%` }}
          />

          {/* Current Progress */}
          <div
            className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Progress Thumb */}
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 bg-red-500 rounded-full transition-all duration-200 ease-out cursor-grab active:cursor-grabbing",
              isFullscreen ? "w-5 h-5" : "w-4 h-4",
              "opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100",
            )}
            style={{ left: `calc(${progressPercentage}% - ${isFullscreen ? "10px" : "8px"})` }}
          />

          {/* Preview Time Tooltip */}
          {previewTime !== null && (
            <div
              className={cn(
                "absolute bottom-full mb-2 px-3 py-1 bg-black/90 text-white text-sm rounded whitespace-nowrap backdrop-blur-sm transition-all duration-200 ease-out",
                isFullscreen && "text-base px-4 py-2",
              )}
              style={{
                left: `calc(${(previewTime / duration) * 100}% - 30px)`,
                transform: "translateX(-50%)",
              }}
            >
              {formatTime(previewTime)}
            </div>
          )}
        </div>
      </div>

      {/* Control Bar - Enhanced with smooth animations */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 transition-all duration-500 ease-out",
          isFullscreen ? "px-8 pb-6" : "px-4 pb-4",
        )}
      >
        {/* Left Controls */}
        <div className="flex items-center space-x-2">
          {/* Playlist Navigation */}
          {hasPlaylist && (
            <>
              <Button
                variant="ghost"
                size={isFullscreen ? "default" : "sm"}
                onClick={onPreviousVideo}
                disabled={!canGoPrevious}
                className={cn(
                  "text-white hover:bg-white/20 transition-all duration-200",
                  !canGoPrevious && "opacity-50 cursor-not-allowed",
                )}
                aria-label="Previous video"
              >
                <ChevronLeft className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
              </Button>

              <Button
                variant="ghost"
                size={isFullscreen ? "default" : "sm"}
                onClick={onNextVideo}
                disabled={!canGoNext}
                className={cn(
                  "text-white hover:bg-white/20 transition-all duration-200",
                  !canGoNext && "opacity-50 cursor-not-allowed",
                )}
                aria-label="Next video"
              >
                <ChevronRight className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size={isFullscreen ? "default" : "sm"}
            onClick={isPlaying ? onPause : onPlay}
            className="text-white hover:bg-white/20 transition-all duration-200"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className={cn("h-5 w-5", isFullscreen && "h-6 w-6")} />
            ) : (
              <Play className={cn("h-5 w-5", isFullscreen && "h-6 w-6")} />
            )}
          </Button>

          <Button
            variant="ghost"
            size={isFullscreen ? "default" : "sm"}
            onClick={onSkipBackward}
            className="text-white hover:bg-white/20 transition-all duration-200"
            aria-label={`Skip backward ${seekDuration} seconds`}
          >
            <SkipBack className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
          </Button>

          <Button
            variant="ghost"
            size={isFullscreen ? "default" : "sm"}
            onClick={onSkipForward}
            className="text-white hover:bg-white/20 transition-all duration-200"
            aria-label={`Skip forward ${seekDuration} seconds`}
          >
            <SkipForward className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
          </Button>

          {/* Volume Control - Enhanced with smooth animations */}
          <div
            className="relative flex items-center group"
            onMouseEnter={handleVolumeSliderShow}
            onMouseLeave={handleVolumeSliderHide}
          >
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size={isFullscreen ? "default" : "sm"}
                onClick={onToggleMute}
                className="text-white hover:bg-white/20 transition-all duration-200"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
                ) : (
                  <Volume2 className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
                )}
              </Button>

              <div
                className={cn(
                  "transition-all duration-300 ease-out overflow-hidden",
                  showVolumeSlider ? (isFullscreen ? "w-32 opacity-100" : "w-20 opacity-100") : "w-0 opacity-0",
                )}
              >
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={(value) => onVolumeChange(value[0] / 100)}
                  max={100}
                  step={1}
                  className="w-full"
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>

          <span
            className={cn(
              "text-white tabular-nums transition-all duration-200",
              isFullscreen ? "text-base" : "text-sm",
            )}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Brightness Control - Enhanced with smooth animations */}
          <div
            className="relative flex items-center group"
            onMouseEnter={handleBrightnessSliderShow}
            onMouseLeave={handleBrightnessSliderHide}
          >
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size={isFullscreen ? "default" : "sm"}
                className="text-white hover:bg-white/20 transition-all duration-200"
                aria-label="Brightness control"
              >
                <Sun className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
              </Button>

              <div
                className={cn(
                  "transition-all duration-300 ease-out overflow-hidden",
                  showBrightnessSlider ? (isFullscreen ? "w-32 opacity-100" : "w-20 opacity-100") : "w-0 opacity-0",
                )}
              >
                <Slider
                  value={[brightness]}
                  onValueChange={(value) => onBrightnessChange(value[0])}
                  min={25}
                  max={200}
                  step={5}
                  className="w-full"
                  aria-label="Brightness"
                />
              </div>
            </div>
          </div>

          {/* Playlist Button */}
          {hasPlaylist && (
            <Button
              variant="ghost"
              size={isFullscreen ? "default" : "sm"}
              onClick={onOpenPlaylist}
              className="text-white hover:bg-white/20 transition-all duration-200"
              aria-label="Open playlist"
            >
              <List className={cn("h-4 w-4", isFullscreen && "h-5 w5")} />
            </Button>
          )}

          <Button
            variant="ghost"
            size={isFullscreen ? "default" : "sm"}
            onClick={onTogglePiP}
            className={cn(
              "text-white hover:bg-white/20 transition-all duration-200",
              !isMetadataLoaded && "opacity-50 cursor-not-allowed",
            )}
            disabled={!isMetadataLoaded}
            aria-label="Picture in Picture"
            title={!isMetadataLoaded ? "Video metadata not loaded yet" : "Toggle Picture in Picture"}
          >
            <PictureInPicture className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
          </Button>

          <Button
            variant="ghost"
            size={isFullscreen ? "default" : "sm"}
            onClick={onToggleTheater}
            className="text-white hover:bg-white/20 transition-all duration-200"
            aria-label="Toggle theater mode"
          >
            <Monitor className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
          </Button>

          <Button
            variant="ghost"
            size={isFullscreen ? "default" : "sm"}
            onClick={onOpenSettings}
            className="text-white hover:bg-white intensely duration-200"
            aria-label="Open settings"
          >
            <Settings className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
          </Button>

          <Button
            variant="ghost"
            size={isFullscreen ? "default" : "sm"}
            onClick={onToggleFullscreen}
            className="text-white hover:bg-white/20 transition-all duration-200"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
            ) : (
              <Maximize className={cn("h-4 w-4", isFullscreen && "h-5 w-5")} />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}