"use client"

import type React from "react"

import { useRef, useState, useCallback, useEffect } from "react"
import { useEnhancedVideoPlayer } from "@/hooks/use-enhanced-video-player"
import { EnhancedVideoControls } from "./enhanced-video-controls"
import { VolumeBrightnessOverlay } from "./volume-brightness-overlay"
import { PlaylistMenu } from "./playlist-menu"
import { LoadingSpinner } from "./loading-spinner"
import { cn } from "@/lib/utils"
import { AlertCircle, RotateCcw, Play, Info, CheckCircle, SkipForward, SkipBack } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClickOutside } from "@/hooks/use-click-outside"
import { SettingsMenu } from "./settings-menu"
import { useInternationalKeyboardShortcuts } from "@/hooks/use-international-keyboard-shortcuts"

interface EnhancedVideoPlayerProps {
  src: string
  videoId: string
  title?: string
  poster?: string
  autoplay?: boolean
  muted?: boolean
  className?: string
  onError?: (error: string) => void
  onPositionRestore?: (time: number) => void
  enablePositionSaving?: boolean
  saveInterval?: number
  chunkSize?: number
  playlist?: Array<{
    id: string
    title: string
    src: string
    poster?: string
  }>
  currentIndex?: number
  onVideoChange?: (index: number) => void
}

export function EnhancedVideoPlayer({
  src,
  videoId,
  title,
  poster,
  autoplay = false,
  muted = false,
  className,
  onError,
  onPositionRestore,
  enablePositionSaving = true,
  saveInterval = 3000,
  chunkSize = 30,
  playlist = [],
  currentIndex = 0,
  onVideoChange,
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [showControls, setShowControls] = useState(true)
  const [brightness, setBrightness] = useState(100)
  const [theaterMode, setTheaterMode] = useState(false)
  const [showRestoreNotification, setShowRestoreNotification] = useState(false)
  const [restoredTime, setRestoredTime] = useState(0)
  const [showBufferInfo, setShowBufferInfo] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
  const [seekDuration, setSeekDuration] = useState(5) // Changed to 5 seconds as requested

  // Volume and brightness overlay states
  const [showVolumeOverlay, setShowVolumeOverlay] = useState(false)
  const [showBrightnessOverlay, setShowBrightnessOverlay] = useState(false)

  // Click handling states
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)

  // Seek feedback state
  const [showSeekFeedback, setShowSeekFeedback] = useState<{
    show: boolean
    direction: "forward" | "backward"
    amount: number
  } | null>(null)

  const settingsRef = useRef<HTMLDivElement>(null)
  const playlistRef = useRef<HTMLDivElement>(null)

  const {
    // Basic state
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    isLoading,
    playbackRate,
    isPiP,
    buffered,
    error,

    // Enhanced state
    bufferChunks,
    isMetadataLoaded,
    canSeek,
    networkState,
    readyState,

    // Methods
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    setPlaybackRate,
    togglePiP,
    skipForward,
    skipBackward,

    // Position management
    getSavedPosition,
    clearSavedPosition,
    sessionId,
  } = useEnhancedVideoPlayer({
    videoRef,
    src,
    videoId,
    autoplay,
    enablePositionSaving,
    saveInterval,
    chunkSize,
  })

  useClickOutside(settingsRef, () => setIsSettingsOpen(false))
  useClickOutside(playlistRef, () => setIsPlaylistOpen(false))

  // Enhanced navigation handlers with proper state management
  const handleNextVideo = useCallback(() => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1
      onVideoChange?.(nextIndex)
    }
  }, [playlist, currentIndex, onVideoChange])

  const handlePreviousVideo = useCallback(() => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1
      onVideoChange?.(prevIndex)
    }
  }, [playlist, currentIndex, onVideoChange])

  // Volume and brightness overlay handlers
  const handleVolumeOverlayShow = useCallback(() => {
    setShowVolumeOverlay(true)
  }, [])

  const handleVolumeOverlayHide = useCallback(() => {
    setShowVolumeOverlay(false)
  }, [])

  const handleBrightnessOverlayShow = useCallback(() => {
    setShowBrightnessOverlay(true)
  }, [])

  const handleBrightnessOverlayHide = useCallback(() => {
    setShowBrightnessOverlay(false)
  }, [])

  // Enhanced volume change with overlay
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      setVolume(newVolume)
      setShowVolumeOverlay(true)
    },
    [setVolume],
  )

  // Enhanced brightness change with overlay
  const handleBrightnessChange = useCallback((newBrightness: number) => {
    setBrightness(newBrightness)
    setShowBrightnessOverlay(true)
  }, [])

  // Enhanced mute toggle with overlay
  const handleMuteToggle = useCallback(() => {
    toggleMute()
    setShowVolumeOverlay(true)
  }, [toggleMute])

  // Enhanced double-click seek handler
  const handleDoubleClickSeek = useCallback(
    (e: React.MouseEvent, direction: "forward" | "backward") => {
      e.preventDefault()
      e.stopPropagation()

      const seekAmount = seekDuration

      if (direction === "forward") {
        skipForward(seekAmount)
      } else {
        skipBackward(seekAmount)
      }

      setShowSeekFeedback({
        show: true,
        direction,
        amount: seekAmount,
      })

      // Hide feedback after animation
      setTimeout(() => {
        setShowSeekFeedback(null)
      }, 1200)
    },
    [seekDuration, skipForward, skipBackward],
  )

  // Enhanced click handler with better double-click detection
  const handleVideoClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't handle clicks if settings or playlist are open
      if (isSettingsOpen || isPlaylistOpen) return

      // Don't handle clicks on control elements
      if ((e.target as HTMLElement).closest('[data-control="true"]')) return

      e.preventDefault()
      e.stopPropagation()

      const now = Date.now()
      const timeSinceLastClick = now - lastClickTime
      setLastClickTime(now)

      // Reset click count if too much time has passed
      if (timeSinceLastClick > 500) {
        setClickCount(1)
      } else {
        setClickCount((prev) => prev + 1)
      }

      // Clear existing timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout)
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        if (clickCount === 1) {
          // Single click - toggle play/pause
          if (isPlaying) {
            pause()
          } else {
            play()
          }
        } else if (clickCount >= 2) {
          // Double click - handle seeking
          const rect = containerRef.current?.getBoundingClientRect()
          if (rect) {
            const clickX = e.clientX - rect.left
            const containerWidth = rect.width
            const isRightSide = clickX > containerWidth / 2

            handleDoubleClickSeek(e, isRightSide ? "forward" : "backward")
          }
        }

        setClickCount(0)
        setClickTimeout(null)
      }, 300)

      setClickTimeout(timeout)
    },
    [
      isPlaying,
      play,
      pause,
      clickTimeout,
      clickCount,
      lastClickTime,
      handleDoubleClickSeek,
      isSettingsOpen,
      isPlaylistOpen,
    ],
  )

  // International keyboard shortcuts with enhanced volume/brightness
  useInternationalKeyboardShortcuts({
    onPlayPause: () => (isPlaying ? pause() : play()),
    onSeek: seek,
    onVolumeChange: handleVolumeChange,
    onToggleMute: handleMuteToggle,
    onToggleFullscreen: toggleFullscreen,
    onSpeedChange: setPlaybackRate,
    onSkipForward: () => skipForward(seekDuration),
    onSkipBackward: () => skipBackward(seekDuration),
    onToggleTheater: () => setTheaterMode(!theaterMode),
    onTogglePiP: togglePiP,
    onNextVideo: handleNextVideo,
    onPreviousVideo: handlePreviousVideo,
    onOpenSettings: () => setIsSettingsOpen(true),
    currentTime,
    duration,
    volume,
    seekDuration,
    isEnabled: !isSettingsOpen && !isPlaylistOpen,
  })

  // Show restore notification when position is restored
  useEffect(() => {
    const savedPosition = getSavedPosition()
    if (savedPosition && savedPosition.currentTime > 10) {
      setShowRestoreNotification(true)
      setRestoredTime(savedPosition.currentTime)
      onPositionRestore?.(savedPosition.currentTime)

      setTimeout(() => {
        setShowRestoreNotification(false)
      }, 6000)
    }
  }, [getSavedPosition, onPositionRestore])

  // Format time helper
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

  // Get buffer percentage
  const getBufferPercentage = useCallback(() => {
    if (!buffered || !duration || duration === 0) return 0

    let bufferedEnd = 0
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
        bufferedEnd = Math.max(bufferedEnd, buffered.end(i))
      }
    }
    return (bufferedEnd / duration) * 100
  }, [buffered, currentTime, duration])

  // Handle play/pause click
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

  // Controls visibility management - Fixed to work after pause
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const resetTimeout = () => {
      clearTimeout(timeout)
      setShowControls(true)

      // Only hide controls if playing and not in fullscreen and no menus open
      if (isPlaying && !isFullscreen && !isSettingsOpen && !isPlaylistOpen) {
        timeout = setTimeout(() => {
          setShowControls(false)
        }, 3000)
      }
    }

    const handleMouseMove = () => resetTimeout()
    const handleMouseLeave = () => {
      clearTimeout(timeout)
      // Only hide controls if playing and not in fullscreen and no menus open
      if (isPlaying && !isFullscreen && !isSettingsOpen && !isPlaylistOpen) {
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
  }, [isPlaying, isFullscreen, isSettingsOpen, isPlaylistOpen])

  // Error callback
  useEffect(() => {
    if (error) {
      onError?.(error)
    }
  }, [error, onError])

  // Cleanup click timeout
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout)
      }
    }
  }, [clickTimeout])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group transition-all duration-300",
        theaterMode ? "w-full aspect-[21/9]" : "aspect-video",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className,
      )}
      onClick={handleVideoClick}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        muted={muted}
        playsInline
        style={{ filter: `brightness(${brightness}%)` }}
        aria-label={title || "Enhanced Video player"}
      >
        Your browser does not support the video tag.
      </video>

      {/* Play Button Overlay */}
      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Button
            onClick={handlePlayClick}
            size="lg"
            className="rounded-full w-20 h-20 bg-black/50 hover:bg-black/70 border-2 border-white/20 transition-all duration-300 hover:scale-110 pointer-events-auto"
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
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </div>
        </div>
      )}

      {/* Volume and Brightness Overlays */}
      <VolumeBrightnessOverlay
        volume={volume}
        brightness={brightness}
        isMuted={isMuted}
        showVolumeOverlay={showVolumeOverlay}
        showBrightnessOverlay={showBrightnessOverlay}
        onVolumeOverlayHide={handleVolumeOverlayHide}
        onBrightnessOverlayHide={handleBrightnessOverlayHide}
      />

      {/* Seek Feedback Overlay */}
      {showSeekFeedback && (
        <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div
            className={cn(
              "flex items-center space-x-4 bg-black/90 text-white px-8 py-4 rounded-2xl shadow-2xl",
              "animate-in fade-in-0 zoom-in-95 duration-300",
              "backdrop-blur-md border border-white/20",
            )}
          >
            {showSeekFeedback.direction === "forward" ? (
              <>
                <div className="p-3 bg-white/10 rounded-full">
                  <SkipForward className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl">+{showSeekFeedback.amount}s</div>
                  <div className="text-sm text-white/70">Fast Forward</div>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-white/10 rounded-full">
                  <SkipBack className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-2xl">-{showSeekFeedback.amount}s</div>
                  <div className="text-sm text-white/70">Rewind</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Position Restore Notification */}
      {showRestoreNotification && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-black/90 text-white px-6 py-3 rounded-lg backdrop-blur-sm border border-white/20 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-sm font-medium">Resumed from {formatTime(restoredTime)}</p>
                <p className="text-xs text-gray-300">Position automatically restored</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
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

      {/* Buffer Info Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setShowBufferInfo(!showBufferInfo)
          }}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>

      {/* Buffer Information Panel */}
      {showBufferInfo && (
        <div className="absolute top-12 right-4 z-40 bg-black/90 text-white p-4 rounded-lg backdrop-blur-sm border border-white/20 text-xs space-y-2 min-w-[200px]">
          <div className="font-semibold border-b border-white/20 pb-2">Buffer Status</div>
          <div>Current Time: {formatTime(currentTime)}</div>
          <div>Duration: {formatTime(duration)}</div>
          <div>Buffer: {getBufferPercentage().toFixed(1)}%</div>
          <div>Ready State: {readyState}/4</div>
          <div>Network State: {networkState}/3</div>
          <div>Chunks Loaded: {bufferChunks.length}</div>
          <div>Session: {sessionId?.slice(-8)}</div>
          <div>Can Seek: {canSeek ? "Yes" : "No"}</div>
          {buffered && (
            <div className="space-y-1">
              <div className="font-medium">Buffered Ranges:</div>
              {Array.from({ length: buffered.length }, (_, i) => (
                <div key={i} className="text-xs text-gray-300">
                  {formatTime(buffered.start(i))} - {formatTime(buffered.end(i))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300 pointer-events-none",
          showControls ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="pointer-events-auto" data-control="true">
          <EnhancedVideoControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            playbackRate={playbackRate}
            isPiP={isPiP}
            brightness={brightness}
            theaterMode={theaterMode}
            currentQuality="Auto"
            buffered={buffered}
            isMetadataLoaded={isMetadataLoaded}
            seekDuration={seekDuration}
            showControls={showControls}
            hasPlaylist={playlist.length > 0}
            canGoNext={currentIndex < playlist.length - 1}
            canGoPrevious={currentIndex > 0}
            onPlay={play}
            onPause={pause}
            onSeek={seek}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleMuteToggle}
            onToggleFullscreen={toggleFullscreen}
            onPlaybackRateChange={setPlaybackRate}
            onTogglePiP={togglePiP}
            onBrightnessChange={handleBrightnessChange}
            onToggleTheater={() => setTheaterMode(!theaterMode)}
            onSkipForward={() => skipForward(seekDuration)}
            onSkipBackward={() => skipBackward(seekDuration)}
            onNextVideo={handleNextVideo}
            onPreviousVideo={handlePreviousVideo}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenPlaylist={() => setIsPlaylistOpen(true)}
            onSeekDurationChange={setSeekDuration}
            onVolumeOverlayShow={handleVolumeOverlayShow}
            onBrightnessOverlayShow={handleBrightnessOverlayShow}
          />
        </div>
      </div>

      {/* Settings Menu */}
      {isSettingsOpen && (
        <div ref={settingsRef} className="absolute inset-0 z-50 pointer-events-auto">
          <SettingsMenu
            sources={[{ src, type: "video/mp4", label: "Auto", res: 1080 }]}
            currentQuality={{ src, type: "video/mp4", label: "Auto", res: 1080 }}
            playbackRate={playbackRate}
            brightness={brightness}
            seekDuration={seekDuration}
            onQualityChange={() => {}}
            onPlaybackRateChange={setPlaybackRate}
            onBrightnessChange={handleBrightnessChange}
            onSeekDurationChange={setSeekDuration}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      )}

      {/* Playlist Menu */}
      {isPlaylistOpen && playlist.length > 0 && (
        <div ref={playlistRef} className="absolute inset-0 z-50 pointer-events-auto">
          <PlaylistMenu
            playlist={playlist.map((item) => ({
              id: item.id,
              title: item.title,
              sources: [{ src: item.src, type: "video/mp4", label: "Auto", res: 1080 }],
              poster: item.poster,
            }))}
            currentIndex={currentIndex}
            onSelectVideo={(index) => {
              clearSavedPosition()
              onVideoChange?.(index)
              setIsPlaylistOpen(false)
            }}
            onClose={() => setIsPlaylistOpen(false)}
          />
        </div>
      )}

      {/* Title */}
      {title && showControls && (
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <h3 className="text-white text-lg font-semibold drop-shadow-lg">{title}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">Enhanced Playback</span>
            {playlist.length > 0 && (
              <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                {currentIndex + 1} of {playlist.length}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Click Instructions Overlay */}
      {isFullscreen && showControls && (
        <div className="absolute bottom-20 left-4 z-10 bg-black/80 text-white text-xs p-3 rounded-lg backdrop-blur-sm border border-white/20 max-w-xs pointer-events-none">
          <div className="font-semibold mb-2">Video Controls</div>
          <div className="space-y-1 text-xs">
            <div>• Single click: Play/Pause</div>
            <div>• Double click left: Rewind {seekDuration}s</div>
            <div>• Double click right: Forward {seekDuration}s</div>
            <div>• Keyboard: Space, ←/→, ↑/↓, F, M, N, B</div>
          </div>
        </div>
      )}
    </div>
  )
}
