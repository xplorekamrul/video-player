"use client"
import { useRef, useState, useCallback, useEffect } from "react"
import { useHLSPlayer } from "@/hooks/use-hls-player"
import { VideoControls } from "./video-controls"
import { LoadingSpinner } from "./loading-spinner"
import { cn } from "@/lib/utils"
import { AlertCircle, RotateCcw, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HLSVideoPlayerProps {
  src: string
  videoId: string
  title?: string
  poster?: string
  autoplay?: boolean
  muted?: boolean
  className?: string
  onError?: (error: string) => void
  onPositionRestore?: (time: number) => void
}

export function HLSVideoPlayer({
  src,
  videoId,
  title,
  poster,
  autoplay = false,
  muted = false,
  className,
  onError,
  onPositionRestore,
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(muted)
  const [brightness, setBrightness] = useState(100)
  const [showRestoreNotification, setShowRestoreNotification] = useState(false)
  const [restoredTime, setRestoredTime] = useState(0)

  const {
    isHLSSupported,
    isLoading,
    error,
    currentTime,
    duration,
    buffered,
    isPlaying,
    canSeek,
    hls,
    play,
    pause,
    seek,
    getSavedPosition,
    clearSavedPosition,
    restorePlaybackPosition,
  } = useHLSPlayer({
    videoRef,
    src,
    videoId,
    autoplay,
    enablePositionSaving: true,
    saveInterval: 3000, // Save every 3 seconds
  })

  // Show restore notification when position is restored
  useEffect(() => {
    const savedPosition = getSavedPosition()
    if (savedPosition && savedPosition.currentTime > 30) {
      // Only show for videos > 30s
      setShowRestoreNotification(true)
      setRestoredTime(savedPosition.currentTime)
      onPositionRestore?.(savedPosition.currentTime)

      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowRestoreNotification(false)
      }, 5000)
    }
  }, [getSavedPosition, onPositionRestore])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Volume control
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }, [])

  // Fullscreen control
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Fullscreen error:", error)
    }
  }, [])

  // Format time helper
  const formatTime = useCallback((time: number) => {
    if (!isFinite(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [])

  // Handle retry
  const handleRetry = useCallback(() => {
    if (hls) {
      hls.startLoad()
    } else {
      window.location.reload()
    }
  }, [hls])

  // Error callback
  useEffect(() => {
    if (error) {
      onError?.(error)
    }
  }, [error, onError])

  // Add click handler for play button
  const handlePlayClick = useCallback(async () => {
    if (isPlaying) {
      pause()
    } else {
      try {
        await play()
      } catch (error) {
        console.error("Play failed:", error)
      }
    }
  }, [isPlaying, play, pause])

  // Add this after the existing useEffect hooks:
  useEffect(() => {
    // Auto-hide controls timeout
    let timeout: NodeJS.Timeout

    const resetTimeout = () => {
      clearTimeout(timeout)
      setShowControls(true)
      timeout = setTimeout(() => {
        if (isPlaying && !isFullscreen) {
          setShowControls(false)
        }
      }, 3000)
    }

    const handleMouseMove = () => resetTimeout()
    const handleMouseLeave = () => {
      clearTimeout(timeout)
      if (isPlaying && !isFullscreen) {
        setShowControls(false)
      }
    }

    if (containerRef.current) {
      containerRef.current.addEventListener("mousemove", handleMouseMove)
      containerRef.current.addEventListener("mouseleave", handleMouseLeave)
    }

    resetTimeout()

    return () => {
      clearTimeout(timeout)
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousemove", handleMouseMove)
        containerRef.current.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [isPlaying, isFullscreen])

  if (!isHLSSupported && !videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
    return (
      <div className="flex items-center justify-center h-64 bg-black rounded-lg">
        <div className="text-center text-white">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">HLS Not Supported</h3>
          <p className="text-sm text-gray-300">Your browser doesn't support HLS streaming</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden aspect-video group",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className,
      )}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        muted={muted}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        style={{ filter: `brightness(${brightness}%)` }}
        aria-label={title || "HLS Video player"}
        onClick={handlePlayClick}
      >
        Your browser does not support the video tag.
      </video>

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <Button
            onClick={handlePlayClick}
            size="lg"
            className="rounded-full w-20 h-20 bg-black/50 hover:bg-black/70 border-2 border-white/20"
          >
            <Play className="h-8 w-8 text-white ml-1" />
          </Button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <LoadingSpinner />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30">
          <div className="text-center text-white p-6">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Playback Error</h3>
            <p className="text-sm text-gray-300 mb-4">{error}</p>
            <Button onClick={handleRetry} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Position Restore Notification */}
      {showRestoreNotification && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/90 text-white px-6 py-3 rounded-lg backdrop-blur-sm border border-white/20 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center space-x-3">
              <RotateCcw className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-sm font-medium">Resumed from {formatTime(restoredTime)}</p>
                <p className="text-xs text-gray-300">Playback position restored</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  seek(0)
                  clearSavedPosition()
                  setShowRestoreNotification(false)
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Start Over
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn("absolute inset-0 transition-opacity duration-300", showControls ? "opacity-100" : "opacity-0")}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <VideoControls
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          playbackRate={1}
          isPiP={false}
          brightness={brightness}
          theaterMode={false}
          currentQuality="Auto"
          buffered={buffered}
          isMetadataLoaded={canSeek}
          seekDuration={10}
          showControls={showControls}
          hasPlaylist={false}
          canGoNext={false}
          canGoPrevious={false}
          onPlay={play}
          onPause={pause}
          onSeek={seek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={toggleMute}
          onToggleFullscreen={toggleFullscreen}
          onPlaybackRateChange={() => {}}
          onTogglePiP={() => {}}
          onBrightnessChange={setBrightness}
          onToggleTheater={() => {}}
          onSkipForward={() => seek(currentTime + 10)}
          onSkipBackward={() => seek(currentTime - 10)}
          onNextVideo={() => {}}
          onPreviousVideo={() => {}}
          onOpenSettings={() => {}}
          onOpenPlaylist={() => {}}
          onSeekDurationChange={() => {}}
        />
      </div>

      {/* Title */}
      {title && showControls && (
        <div className="absolute top-4 left-4 z-10">
          <h3 className="text-white text-lg font-semibold drop-shadow-lg">{title}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
              {isHLSSupported ? "HLS" : "Native"} Streaming
            </span>
            {hls && (
              <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                Level: {hls.currentLevel >= 0 ? hls.levels[hls.currentLevel]?.height + "p" : "Auto"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Buffer Indicator */}
      {isLoading && (
        <div className="absolute bottom-20 right-4 z-10">
          <div className="bg-black/80 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm">Buffering...</div>
        </div>
      )}
    </div>
  )
}
