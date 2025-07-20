

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
import { EnhancedSettingsMenu } from "./enhanced-settings-menu"
import { useInternationalKeyboardShortcuts } from "../hooks/use-international-keyboard-shortcuts"

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
   const [isRealFullscreen, setIsRealFullscreen] = useState(false)
   const [showControls, setShowControls] = useState(true)
   const [brightness, setBrightness] = useState(100)
   const [theaterMode, setTheaterMode] = useState(false)
   const [showRestoreNotification, setShowRestoreNotification] = useState(false)
   const [restoredTime, setRestoredTime] = useState(0)
   const [showBufferInfo, setShowBufferInfo] = useState(false)
   const [isSettingsOpen, setIsSettingsOpen] = useState(false)
   const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
   const [seekDuration, setSeekDuration] = useState(5)
   const [showVolumeOverlay, setShowVolumeOverlay] = useState(false)
   const [showBrightnessOverlay, setShowBrightnessOverlay] = useState(false)
   const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)
   const [clickCount, setClickCount] = useState(0)
   const [lastClickTime, setLastClickTime] = useState(0)
   const [showSeekFeedback, setShowSeekFeedback] = useState<{
      show: boolean
      direction: "forward" | "backward"
      amount: number
   } | null>(null)
   const settingsRef = useRef<HTMLDivElement>(null)
   const playlistRef = useRef<HTMLDivElement>(null)
   const bufferInfoRef = useRef<HTMLDivElement>(null);
   useClickOutside(bufferInfoRef as React.RefObject<HTMLElement>, () => setShowBufferInfo(false));

   const {
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      isLoading,
      playbackRate,
      isPiP,
      buffered,
      error,
      bufferChunks,
      isMetadataLoaded,
      canSeek,
      networkState,
      readyState,
      play,
      pause,
      seek,
      setVolume,
      toggleMute,
      setPlaybackRate,
      togglePiP,
      skipForward,
      skipBackward,
      getSavedPosition,
      clearSavedPosition,
      sessionId,
   } = useEnhancedVideoPlayer({
      videoRef: videoRef as React.RefObject<HTMLVideoElement>,
      src,
      videoId,
      autoplay,
      enablePositionSaving,
      saveInterval,
      chunkSize,
   })

   useClickOutside(settingsRef as React.RefObject<HTMLElement>, () => setIsSettingsOpen(false))
   useClickOutside(playlistRef as React.RefObject<HTMLElement>, () => setIsPlaylistOpen(false))

   const toggleFullscreen = useCallback(() => {
      if (!document.fullscreenElement) {
         containerRef.current?.requestFullscreen().catch((err) => {
            console.error(`Failed to enter fullscreen: ${err.message}`)
         })
      } else {
         document.exitFullscreen().catch((err) => {
            console.error(`Failed to exit fullscreen: ${err.message}`)
         })
      }
   }, [])

   useEffect(() => {
      const handleFullscreenChange = () => {
         setIsRealFullscreen(!!document.fullscreenElement)
         setShowControls(true) // Ensure controls are visible on fullscreen change
      }
      document.addEventListener("fullscreenchange", handleFullscreenChange)
      return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
   }, [])

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

   const handleVolumeChange = useCallback(
      (newVolume: number) => {
         setVolume(newVolume)
         setShowVolumeOverlay(true)
      },
      [setVolume],
   )

   const handleBrightnessChange = useCallback((newBrightness: number) => {
      setBrightness(newBrightness)
      setShowBrightnessOverlay(true)
   }, [])

   const handleMuteToggle = useCallback(() => {
      toggleMute()
      setShowVolumeOverlay(true)
   }, [toggleMute])

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

         setTimeout(() => {
            setShowSeekFeedback(null)
         }, 1200)
      },
      [seekDuration, skipForward, skipBackward],
   )

   const handleVideoClick = useCallback(
      (e: React.MouseEvent) => {
         if (isSettingsOpen || isPlaylistOpen) return
         if ((e.target as HTMLElement).closest('[data-control="true"]')) return

         e.preventDefault()
         e.stopPropagation()

         const now = Date.now()
         const timeSinceLastClick = now - lastClickTime
         setLastClickTime(now)

         if (timeSinceLastClick > 500) {
            setClickCount(1)
         } else {
            setClickCount((prev) => prev + 1)
         }

         if (clickTimeout) {
            clearTimeout(clickTimeout)
         }

         const timeout = setTimeout(() => {
            if (clickCount === 1) {
               if (isPlaying) {
                  pause()
               } else {
                  play()
               }
               setShowControls(true)
            } else if (clickCount >= 2) {
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

  useEffect(() => {
  const savedPosition = getSavedPosition()
  if (savedPosition && savedPosition.currentTime > 10) {
    const video = videoRef.current
    if (video) {
      const handleMetadataLoaded = () => {
        video.currentTime = savedPosition.currentTime // Directly set the time
        setShowRestoreNotification(true)
        setRestoredTime(savedPosition.currentTime)
        onPositionRestore?.(savedPosition.currentTime)

        setTimeout(() => setShowRestoreNotification(false), 6000)
        video.removeEventListener("loadedmetadata", handleMetadataLoaded)
      }

      // If metadata is already loaded, seek immediately
      if (video.readyState >= 1) {
        handleMetadataLoaded()
      } else {
        video.addEventListener("loadedmetadata", handleMetadataLoaded)
      }
    }
  }
}, [getSavedPosition, onPositionRestore])


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

   const getBufferPercentage = useCallback(() => {
      if (!buffered || !duration || duration === 0) return 0

      let bufferedEnd = 0
      for (let i = buffered.length - 1; i >= 0; i--) {
         if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
            bufferedEnd = Math.max(bufferedEnd, buffered.end(i))
            break
         }
      }
      return (bufferedEnd / duration) * 100
   }, [buffered, currentTime, duration])

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
      setShowControls(true)
   }, [isPlaying, play, pause])

   useEffect(() => {
      let timeout: NodeJS.Timeout

      const resetTimeout = () => {
         clearTimeout(timeout)
         setShowControls(true)

         if (isRealFullscreen && isPlaying && !isSettingsOpen && !isPlaylistOpen) {
            timeout = setTimeout(() => {
               setShowControls(false)
            }, 4000)
         } else if (isPlaying && !isRealFullscreen && !isSettingsOpen && !isPlaylistOpen) {
            timeout = setTimeout(() => {
               setShowControls(false)
            }, 3000)
         }
      }

      const handleInteraction = () => {
         resetTimeout()
      }

      if (containerRef.current) {
         containerRef.current.addEventListener("mousemove", handleInteraction)
         containerRef.current.addEventListener("touchstart", handleInteraction)
         document.addEventListener("keydown", handleInteraction)
      }

      resetTimeout()

      return () => {
         clearTimeout(timeout)
         if (containerRef.current) {
            containerRef.current.removeEventListener("mousemove", handleInteraction)
            containerRef.current.removeEventListener("touchstart", handleInteraction)
         }
         document.removeEventListener("keydown", handleInteraction)
      }
   }, [isPlaying, isRealFullscreen, isSettingsOpen, isPlaylistOpen])

   const shouldShowControls = showControls || isSettingsOpen || isPlaylistOpen || !isPlaying

   return (
      <div
         ref={containerRef}
         className={cn(
            "relative bg-black rounded-lg overflow-hidden group transition-all duration-300",
            theaterMode ? "w-full aspect-[21/9]" : "aspect-video",
            isRealFullscreen && "fixed inset-0 z-[1000] rounded-none",
            className,
         )}
         onClick={handleVideoClick}
      >
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

         {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
               <LoadingSpinner />
            </div>
         )}

         {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
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
         <div className="absolute top-4 right-4 z-40">
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
            <div
               ref={bufferInfoRef}
               className="absolute top-12 right-4 z-40 bg-black/90 text-white p-4 rounded-lg backdrop-blur-sm border border-white/20 text-xs space-y-2 min-w-[200px]"
            >
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


         <div
            className={cn(
               "absolute inset-0 transition-opacity duration-300",
               shouldShowControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
         >
            <div className="pointer-events-auto" data-control="true">
               <EnhancedVideoControls
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  volume={volume}
                  isMuted={isMuted}
                  isFullscreen={isRealFullscreen}
                  playbackRate={playbackRate}
                  isPiP={isPiP}
                  brightness={brightness}
                  theaterMode={theaterMode}
                  currentQuality="Auto"
                  buffered={buffered}
                  isMetadataLoaded={isMetadataLoaded}
                  seekDuration={seekDuration}
                  showControls={shouldShowControls}
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
            <div ref={settingsRef} className={cn("absolute inset-0 pointer-events-auto", isRealFullscreen ? "z-60" : "z-50")}>
               <EnhancedSettingsMenu
                  sources={[{ src, type: "video/mp4", label: "Auto", res: 1080 }]}
                  currentQuality={{ src, type: "video/mp4", label: "Auto", res: 1080 }}
                  playbackRate={playbackRate}
                  brightness={brightness}
                  seekDuration={seekDuration}
                  volume={volume}
                  onVolumeChange={handleVolumeChange}
                  onQualityChange={() => { }}
                  onPlaybackRateChange={setPlaybackRate}
                  onBrightnessChange={handleBrightnessChange}
                  onSeekDurationChange={setSeekDuration}
                  onClose={() => setIsSettingsOpen(false)}
               />
            </div>
         )}


         {/* Playlist Menu */}
         {isPlaylistOpen && playlist.length > 0 && (
            <div ref={playlistRef} className={cn("absolute inset-0 pointer-events-auto", isRealFullscreen ? "z-60" : "z-50")}>
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
         {title && shouldShowControls && (
            <div className={cn("absolute top-4 left-4 pointer-events-none", isRealFullscreen ? "z-50" : "z-10")}>
               <h3 className={cn("text-white font-semibold drop-shadow-lg", isRealFullscreen ? "text-2xl" : "text-lg")}>
                  {title}
               </h3>
               <div className="flex items-center space-x-2 mt-1">
                  {/* <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">Enhanced Playback</span> */}
                  {playlist.length > 0 && (
                     <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
                        {currentIndex + 1} of {playlist.length}
                     </span>
                  )}
                  {/* {isRealFullscreen && (
                     <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded">Fullscreen Mode</span>
                  )} */}
               </div>
            </div>
         )}

         {/* {isRealFullscreen && shouldShowControls && (
        <div className="absolute bottom-24 left-4 z-[1004] bg-black/80 text-white text-sm p-4 rounded-lg backdrop-blur-sm border border-white/20 max-w-md pointer-events-none">
          <div className="font-semibold mb-2 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Fullscreen Controls
          </div>
          <div className="space-y-1 text-xs">
            <div>• Move mouse to show controls</div>
            <div>• Single click: Play/Pause</div>
            <div>• Double click left: Rewind {seekDuration}s</div>
            <div>• Double click right: Forward {seekDuration}s</div>
            <div>• Press any key to show controls</div>
            <div>• ESC or F: Exit fullscreen</div>
            <div>• Space: Play/Pause | ↑/↓: Volume | ←/→: Seek</div>
          </div>
        </div>
      )} */}

         {isRealFullscreen && !shouldShowControls && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1004] bg-black/60 text-white text-xs px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 pointer-events-none animate-pulse">
               Move mouse or press any key to show controls
            </div>
         )}
      </div>
   )
}