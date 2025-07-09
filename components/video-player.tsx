"use client"

import type React from "react"

import { useClickOutside } from "@/hooks/use-click-outside"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useMobileGestures } from "@/hooks/use-mobile-gestures"
import { useVideoPlayer } from "@/hooks/use-video-player"
import { useVideoResume } from "@/hooks/use-video-resume"
import { cn } from "@/lib/utils"
import { SkipBack, SkipForward } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { LoadingSpinner } from "./loading-spinner"
import { PlaylistMenu } from "./playlist-menu"
import { SettingsMenu } from "./settings-menu"
import { VideoControls } from "./video-controls"

interface VideoSource {
  src: string
  type: string
  label: string
  res: number
}

interface PlaylistItem {
  id: string
  title: string
  sources: VideoSource[]
  poster?: string
  duration?: number
}

interface VideoPlayerProps {
  sources: VideoSource[]
  poster?: string
  title?: string
  videoId: string
  autoplay?: boolean
  muted?: boolean
  watermark?: string
  className?: string
  playlist?: PlaylistItem[]
  currentPlaylistIndex?: number
  onPlaylistChange?: (index: number) => void
}

export function VideoPlayer({
  sources,
  poster,
  title,
  videoId,
  autoplay = false,
  muted = false,
  watermark,
  className,
  playlist = [],
  currentPlaylistIndex = 0,
  onPlaylistChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const playlistRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  const [showControls, setShowControls] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
  const [theaterMode, setTheaterMode] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [currentQuality, setCurrentQuality] = useState(sources[0])
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false)
  const [seekDuration, setSeekDuration] = useState(10)
  const [showSeekFeedback, setShowSeekFeedback] = useState<{
    show: boolean
    direction: "forward" | "backward"
    amount: number
  } | null>(null)
  const [cursorVisible, setCursorVisible] = useState(true)
  const [lastSavedTime, setLastSavedTime] = useState(0) // Track last saved time

  const {
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
  } = useVideoPlayer(videoRef)

  const { saveProgress, getLastPosition, clearProgress } = useVideoResume(videoId)

  // Click outside handlers for dropdowns
  useClickOutside(settingsRef, () => setIsSettingsOpen(false))
  useClickOutside(playlistRef, () => setIsPlaylistOpen(false))

  // Handle metadata loaded
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setIsMetadataLoaded(true)
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata)
  }, [])

  // Enhanced cursor and controls management for fullscreen
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resetControlsTimeout = () => {
      clearTimeout(controlsTimeoutRef.current)
      setShowControls(true)
      setCursorVisible(true)

      // In fullscreen, hide controls and cursor after 20 seconds of inactivity
      if (isFullscreen) {
        controlsTimeoutRef.current = setTimeout(() => {
          if (!isSettingsOpen && !isPlaylistOpen) {
            setShowControls(false)
            setCursorVisible(false)
          }
        }, 20000)
      } else {
        // In normal mode, only hide controls if playing
        if (isPlaying && !isSettingsOpen && !isPlaylistOpen) {
          controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false)
          }, 3000)
        }
      }
    }

    const handleMouseMove = () => {
      resetControlsTimeout()
    }

    const handleMouseLeave = () => {
      clearTimeout(controlsTimeoutRef.current)
      if (isFullscreen) {
        // In fullscreen, start hiding after 5 seconds when mouse leaves
        controlsTimeoutRef.current = setTimeout(() => {
          if (!isSettingsOpen && !isPlaylistOpen) {
            setShowControls(false)
            setCursorVisible(false)
          }
        }, 5000)
      } else if (isPlaying && !isSettingsOpen && !isPlaylistOpen) {
        setShowControls(false)
      }
    }

    const handleMouseEnter = () => {
      resetControlsTimeout()
    }

    // Add event listeners
    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseleave", handleMouseLeave)
    container.addEventListener("mouseenter", handleMouseEnter)

    // Initial setup
    resetControlsTimeout()

    return () => {
      clearTimeout(controlsTimeoutRef.current)
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseleave", handleMouseLeave)
      container.removeEventListener("mouseenter", handleMouseEnter)
    }
  }, [isPlaying, isSettingsOpen, isPlaylistOpen, isFullscreen])

  // Handle dropdown state changes
  useEffect(() => {
    if (isSettingsOpen || isPlaylistOpen) {
      clearTimeout(controlsTimeoutRef.current)
      setShowControls(true)
      setCursorVisible(true)
    }
  }, [isSettingsOpen, isPlaylistOpen])

  // Enhanced resume playback functionality with 4-minute fix
  useEffect(() => {
    if (videoRef.current && duration > 0 && isMetadataLoaded) {
      const lastPosition = getLastPosition()
      // Only resume if the position is valid and not at the problematic 4-minute mark
      if (lastPosition > 0 && lastPosition < duration - 10 && Math.abs(lastPosition - 240) > 5) {
        seek(lastPosition)
        setLastSavedTime(lastPosition)
      }
    }
  }, [duration, isMetadataLoaded, getLastPosition, seek])

  // Enhanced progress saving with 4-minute issue prevention
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTime > 0 && duration > 0) {
        // Avoid saving progress at exactly 4 minutes (240 seconds) to prevent restart issue
        const timeToSave = Math.abs(currentTime - 240) < 1 ? currentTime + 1 : currentTime

        // Only save if time has changed significantly
        if (Math.abs(timeToSave - lastSavedTime) > 2) {
          saveProgress(timeToSave)
          setLastSavedTime(timeToSave)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [currentTime, duration, saveProgress, lastSavedTime])

  // Quality change handler with proper state management
  const handleQualityChange = useCallback(
    (quality: VideoSource) => {
      if (videoRef.current && quality.src !== currentQuality.src) {
        const currentTime = videoRef.current.currentTime
        const wasPlaying = !videoRef.current.paused

        setCurrentQuality(quality)
        setIsMetadataLoaded(false)

        const handleLoadedData = () => {
          if (videoRef.current) {
            videoRef.current.currentTime = currentTime
            if (wasPlaying) {
              play().catch(console.error)
            }
            videoRef.current.removeEventListener("loadeddata", handleLoadedData)
          }
        }

        videoRef.current.addEventListener("loadeddata", handleLoadedData)
      }
    },
    [currentQuality.src, play],
  )

  // Enhanced PiP toggle with proper error handling
  const handlePiPToggle = useCallback(async () => {
    if (!videoRef.current) return

    try {
      if (!isMetadataLoaded) {
        throw new Error("Video metadata not loaded yet")
      }

      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else {
        await videoRef.current.requestPictureInPicture()
      }
    } catch (error) {
      console.error("Picture-in-Picture error:", error)
    }
  }, [isMetadataLoaded])

  // Playlist navigation handlers
  const handleNextVideo = useCallback(() => {
    if (playlist.length > 0 && currentPlaylistIndex < playlist.length - 1) {
      clearProgress() // Clear current video progress
      onPlaylistChange?.(currentPlaylistIndex + 1)
    }
  }, [playlist.length, currentPlaylistIndex, onPlaylistChange, clearProgress])

  const handlePreviousVideo = useCallback(() => {
    if (playlist.length > 0 && currentPlaylistIndex > 0) {
      clearProgress() // Clear current video progress
      onPlaylistChange?.(currentPlaylistIndex - 1)
    }
  }, [playlist.length, currentPlaylistIndex, onPlaylistChange, clearProgress])

  // Auto-advance to next video when current ends
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleVideoEnd = () => {
      if (playlist.length > 0 && currentPlaylistIndex < playlist.length - 1) {
        handleNextVideo()
      }
    }

    video.addEventListener("ended", handleVideoEnd)
    return () => video.removeEventListener("ended", handleVideoEnd)
  }, [playlist.length, currentPlaylistIndex, handleNextVideo])

  // Enhanced double-click seek handler
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!videoRef.current || !containerRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const rect = containerRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const containerWidth = rect.width
      const isRightSide = clickX > containerWidth / 2

      const seekAmount = seekDuration

      if (isRightSide) {
        skipForward(seekAmount)
        setShowSeekFeedback({
          show: true,
          direction: "forward",
          amount: seekAmount,
        })
      } else {
        skipBackward(seekAmount)
        setShowSeekFeedback({
          show: true,
          direction: "backward",
          amount: seekAmount,
        })
      }

      // Hide feedback after animation
      setTimeout(() => {
        setShowSeekFeedback(null)
      }, 1200)
    },
    [seekDuration, skipForward, skipBackward],
  )

  // Enhanced click handler with better double-click detection
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)
  const [clickCount, setClickCount] = useState(0)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't handle clicks on dropdown menus
      if (isSettingsOpen || isPlaylistOpen) return

      e.preventDefault()
      setClickCount((prev) => prev + 1)

      if (clickTimeout) {
        clearTimeout(clickTimeout)
      }

      const timeout = setTimeout(() => {
        if (clickCount === 1) {
          // Single click - toggle play/pause
          if (isPlaying) {
            pause()
          } else {
            play()
          }
        } else if (clickCount === 2) {
          // Double click - handle seeking
          handleDoubleClick(e)
        }

        setClickCount(0)
        setClickTimeout(null)
      }, 250)

      setClickTimeout(timeout)
    },
    [isPlaying, play, pause, clickTimeout, clickCount, handleDoubleClick, isSettingsOpen, isPlaylistOpen],
  )

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onPlayPause: () => (isPlaying ? pause() : play()),
    onSeek: seek,
    onVolumeChange: setVolume,
    onToggleMute: toggleMute,
    onToggleFullscreen: toggleFullscreen,
    onSpeedChange: setPlaybackRate,
    onSkipForward: () => skipForward(seekDuration),
    onSkipBackward: () => skipBackward(seekDuration),
    onToggleTheater: () => setTheaterMode(!theaterMode),
    onTogglePiP: handlePiPToggle,
    onNextVideo: handleNextVideo,
    onPreviousVideo: handlePreviousVideo,
    currentTime,
    duration,
    volume,
    seekDuration,
    isEnabled: !isSettingsOpen && !isPlaylistOpen,
  })

  // Mobile gestures
  useMobileGestures(containerRef, {
    onTap: () => (isPlaying ? pause() : play()),
    onSwipeLeft: () => skipBackward(seekDuration),
    onSwipeRight: () => skipForward(seekDuration),
    onSwipeUp: () => setVolume(Math.min(1, volume + 0.1)),
    onSwipeDown: () => setVolume(Math.max(0, volume - 0.1)),
  })

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-black rounded-lg overflow-hidden transition-all duration-500 group",
        theaterMode ? "w-full aspect-[21/9]" : "max-w-4xl mx-auto aspect-video",
        isFullscreen && "fixed inset-0 z-50 rounded-none max-w-none",
        // Dynamic cursor visibility in fullscreen
        isFullscreen && !cursorVisible && "cursor-none",
        className,
      )}
      role="region"
      aria-label="Video player"
      onClick={handleClick}
      style={{
        cursor: isFullscreen && !cursorVisible ? "none" : "pointer",
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover transition-all duration-300"
        poster={poster}
        autoPlay={autoplay}
        muted={muted}
        playsInline
        preload="metadata"
        style={{ filter: `brightness(${brightness}%)` }}
        aria-label={title || "Video player"}
      >
        <source src={currentQuality.src} type={currentQuality.type} />
        <track kind="captions" src="/captions.vtt" srcLang="en" label="English" />
        Your browser does not support the video tag.
      </video>

      {/* Seek Zones Overlay - Enhanced for fullscreen */}
      {isFullscreen && showControls && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-center">
            <div className="bg-black/30 text-white/70 px-6 py-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm border border-white/10">
              <div className="flex items-center space-x-3">
                <SkipBack className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-semibold">Double-click</div>
                  <div className="text-sm text-white/60">Rewind {seekDuration}s</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center">
            <div className="bg-black/30 text-white/70 px-6 py-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="font-semibold">Double-click</div>
                  <div className="text-sm text-white/60">Fast-forward {seekDuration}s</div>
                </div>
                <SkipForward className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Watermark */}
      {watermark && (
        <div className="absolute top-4 right-4 opacity-70 pointer-events-none z-10 transition-all duration-300">
          <img src={watermark || "/placeholderImage.jpg"} alt="Watermark" className="h-8 drop-shadow-lg" />
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 transition-all duration-300">
          <LoadingSpinner />
        </div>
      )}

      {/* Controls Overlay with enhanced animations */}
      <div
        className={cn(
          "absolute inset-0 transition-all duration-500 ease-out z-30",
          showControls ? "opacity-100 translate-y-0" : "opacity-0",
          // In fullscreen, controls slide up from bottom when hidden
          isFullscreen && !showControls && "translate-y-full",
        )}
      >
        <VideoControls
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
          currentQuality={currentQuality.label}
          buffered={buffered}
          isMetadataLoaded={isMetadataLoaded}
          seekDuration={seekDuration}
          showControls={showControls}
          hasPlaylist={playlist.length > 0}
          canGoNext={currentPlaylistIndex < playlist.length - 1}
          canGoPrevious={currentPlaylistIndex > 0}
          onPlay={play}
          onPause={pause}
          onSeek={seek}
          onVolumeChange={setVolume}
          onToggleMute={toggleMute}
          onToggleFullscreen={toggleFullscreen}
          onPlaybackRateChange={setPlaybackRate}
          onTogglePiP={handlePiPToggle}
          onBrightnessChange={setBrightness}
          onToggleTheater={() => setTheaterMode(!theaterMode)}
          onSkipForward={() => skipForward(seekDuration)}
          onSkipBackward={() => skipBackward(seekDuration)}
          onNextVideo={handleNextVideo}
          onPreviousVideo={handlePreviousVideo}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenPlaylist={() => setIsPlaylistOpen(true)}
          onSeekDurationChange={setSeekDuration}
        />
      </div>

      {/* Settings Menu with enhanced animations */}
      {isSettingsOpen && (
        <div ref={settingsRef} className="absolute inset-0 z-40 animate-in fade-in-0 duration-300">
          <SettingsMenu
            sources={sources}
            currentQuality={currentQuality}
            playbackRate={playbackRate}
            brightness={brightness}
            seekDuration={seekDuration}
            onQualityChange={handleQualityChange}
            onPlaybackRateChange={setPlaybackRate}
            onBrightnessChange={setBrightness}
            onSeekDurationChange={setSeekDuration}
            onClose={() => setIsSettingsOpen(false)}
          />
        </div>
      )}

      {/* Playlist Menu with enhanced animations */}
      {isPlaylistOpen && playlist.length > 0 && (
        <div ref={playlistRef} className="absolute inset-0 z-40 animate-in fade-in-0 duration-300">
          <PlaylistMenu
            playlist={playlist}
            currentIndex={currentPlaylistIndex}
            onSelectVideo={(index) => {
              clearProgress()
              onPlaylistChange?.(index)
              setIsPlaylistOpen(false)
            }}
            onClose={() => setIsPlaylistOpen(false)}
          />
        </div>
      )}

      {/* Title Overlay - Enhanced with animations */}
      {title && showControls && (
        <div
          className={cn(
            "absolute top-4 left-4 z-10 transition-all duration-500 ease-out",
            isFullscreen && !showControls && "opacity-0 -translate-y-4",
          )}
        >
          <h3 className="text-white text-lg font-semibold drop-shadow-lg">{title}</h3>
          {playlist.length > 0 && (
            <p className="text-white/70 text-sm mt-1">
              {currentPlaylistIndex + 1} of {playlist.length}
            </p>
          )}
        </div>
      )}

      {/* Enhanced Seek Feedback Overlay */}
      {showSeekFeedback && (
        <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center">
          <div
            className={cn(
              "flex items-center space-x-4 bg-black/90 text-white px-8 py-4 rounded-2xl shadow-2xl",
              "animate-in fade-in-0 zoom-in-95 duration-300",
              "backdrop-blur-md border border-white/20",
              showSeekFeedback.direction === "forward" ? "translate-x-8" : "-translate-x-8",
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

      {/* Enhanced Fullscreen Exit Hint */}
      {isFullscreen && showControls && (
        <div
          className={cn(
            "absolute top-6 right-6 z-10 transition-all duration-500 ease-out",
            !showControls && "opacity-0 translate-y-2",
          )}
        >
          <div className="bg-black/90 text-white text-sm px-6 py-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <div>
                <div className="font-semibold">Press ESC or F to exit fullscreen</div>
                <div className="text-xs text-white/60 mt-1">Controls hide after 20 seconds</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
