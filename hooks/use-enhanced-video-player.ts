"use client"

import { useState, useEffect, useCallback, useRef, type RefObject } from "react"

interface VideoPlayerOptions {
  videoRef: RefObject<HTMLVideoElement>
  src: string
  videoId: string
  autoplay?: boolean
  enablePositionSaving?: boolean
  saveInterval?: number
  chunkSize?: number
  preloadStrategy?: "none" | "metadata" | "auto"
}

interface PlaybackPosition {
  videoId: string
  currentTime: number
  duration: number
  timestamp: number
  bufferedRanges: Array<{ start: number; end: number }>
  playbackRate: number
  volume: number
  sessionId: string
}

interface BufferChunk {
  start: number
  end: number
  loaded: boolean
  timestamp: number
}

export function useEnhancedVideoPlayer({
  videoRef,
  src,
  videoId,
  autoplay = false,
  enablePositionSaving = true,
  saveInterval = 3000,
  chunkSize = 30, // 30 seconds per chunk
  preloadStrategy = "metadata",
}: VideoPlayerOptions) {
  // Basic video state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isPiP, setIsPiP] = useState(false)
  const [buffered, setBuffered] = useState<TimeRanges | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Enhanced tracking state
  const [bufferChunks, setBufferChunks] = useState<BufferChunk[]>([])
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false)
  const [canSeek, setCanSeek] = useState(false)
  const [networkState, setNetworkState] = useState<number>(0)
  const [readyState, setReadyState] = useState<number>(0)

  // Refs for managing state
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedTimeRef = useRef(0)
  const positionRestoredRef = useRef(false)
  const seekingToSavedPositionRef = useRef(false)
  const sessionIdRef = useRef<string>()
  const playPromiseRef = useRef<Promise<void> | null>(null)
  const saveIntervalRef = useRef<NodeJS.Timeout>()

  // Generate session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Storage keys
  const getStorageKey = useCallback((id: string) => `video_position_${id}`, [])
  const getSessionKey = useCallback((id: string) => `video_session_${id}`, [])
  const getChunkKey = useCallback((id: string) => `video_chunks_${id}`, [])

  // Initialize session
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = generateSessionId()
    }
  }, [generateSessionId])

  // Debounced position saving with enhanced data
  const savePlaybackPosition = useCallback(
    (time: number, force = false) => {
      if (!enablePositionSaving || !videoRef.current || !sessionIdRef.current) return

      const video = videoRef.current
      const now = Date.now()

      // Debounce saving (don't save too frequently unless forced)
      if (!force && Math.abs(time - lastSavedTimeRef.current) < 1) return

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Save with debounce
      saveTimeoutRef.current = setTimeout(
        () => {
          try {
            const bufferedRanges: Array<{ start: number; end: number }> = []

            if (video.buffered) {
              for (let i = 0; i < video.buffered.length; i++) {
                bufferedRanges.push({
                  start: video.buffered.start(i),
                  end: video.buffered.end(i),
                })
              }
            }

            const position: PlaybackPosition = {
              videoId,
              currentTime: time,
              duration: video.duration || 0,
              timestamp: now,
              bufferedRanges,
              playbackRate: video.playbackRate,
              volume: video.volume,
              sessionId: sessionIdRef.current!,
            }

            // Save to both storages with different strategies
            localStorage.setItem(getStorageKey(videoId), JSON.stringify(position))
            sessionStorage.setItem(getSessionKey(videoId), JSON.stringify(position))

            // Save buffer chunks information
            const chunkData = {
              chunks: bufferChunks,
              timestamp: now,
              sessionId: sessionIdRef.current,
            }
            localStorage.setItem(getChunkKey(videoId), JSON.stringify(chunkData))

            lastSavedTimeRef.current = time
            console.log(`💾 Saved position: ${time.toFixed(2)}s for video ${videoId}`)
          } catch (error) {
            console.error("Failed to save playback position:", error)
          }
        },
        force ? 0 : 1000,
      )
    },
    [videoId, enablePositionSaving, getStorageKey, getSessionKey, getChunkKey, videoRef, bufferChunks],
  )

  // Get saved playback position with validation
  const getSavedPosition = useCallback((): PlaybackPosition | null => {
    try {
      // Try session storage first (more recent), then localStorage
      const sessionData = sessionStorage.getItem(getSessionKey(videoId))
      const localData = localStorage.getItem(getStorageKey(videoId))

      let position: PlaybackPosition | null = null

      if (sessionData) {
        position = JSON.parse(sessionData)
      } else if (localData) {
        position = JSON.parse(localData)
      }

      // Validate position data
      if (position && position.videoId === videoId && position.currentTime > 0) {
        // Check if position is not too old (older than 24 hours for session, 7 days for persistent)
        const maxAge = sessionData ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
        const isOld = Date.now() - position.timestamp > maxAge

        if (!isOld) {
          return position
        }
      }
    } catch (error) {
      console.error("Failed to get saved position:", error)
    }
    return null
  }, [videoId, getStorageKey, getSessionKey])

  // Clear saved position and chunks
  const clearSavedPosition = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(videoId))
      sessionStorage.removeItem(getSessionKey(videoId))
      localStorage.removeItem(getChunkKey(videoId))
      lastSavedTimeRef.current = 0
      setBufferChunks([])
      console.log(`🗑️ Cleared saved position for video ${videoId}`)
    } catch (error) {
      console.error("Failed to clear saved position:", error)
    }
  }, [videoId, getStorageKey, getSessionKey, getChunkKey])

  // Smart seeking with buffer awareness
  const findNearestSeekableTime = useCallback(
    (targetTime: number): { time: number; reason: string } => {
      const video = videoRef.current
      if (!video) return { time: 0, reason: "No video element" }

      // Check if target time is within seekable ranges
      if (video.seekable && video.seekable.length > 0) {
        for (let i = 0; i < video.seekable.length; i++) {
          const start = video.seekable.start(i)
          const end = video.seekable.end(i)

          if (targetTime >= start && targetTime <= end) {
            return { time: targetTime, reason: "Exact position available" }
          }

          if (targetTime < start) {
            return { time: start, reason: `Seeked to nearest start: ${start.toFixed(2)}s` }
          }
        }

        // If target is after all ranges, use the end of the last range
        const lastIndex = video.seekable.length - 1
        const lastEnd = video.seekable.end(lastIndex)
        return { time: lastEnd, reason: `Seeked to last available: ${lastEnd.toFixed(2)}s` }
      }

      // Fallback: check buffered ranges
      if (video.buffered && video.buffered.length > 0) {
        for (let i = 0; i < video.buffered.length; i++) {
          const start = video.buffered.start(i)
          const end = video.buffered.end(i)

          if (targetTime >= start && targetTime <= end) {
            return { time: targetTime, reason: "Position in buffered range" }
          }

          if (targetTime < start) {
            return { time: start, reason: `Seeked to buffered start: ${start.toFixed(2)}s` }
          }
        }
      }

      // Last resort: use current time or 0
      return { time: Math.max(0, video.currentTime), reason: "Fallback to current/start position" }
    },
    [videoRef],
  )

  // Enhanced position restoration with smart seeking
  const restorePlaybackPosition = useCallback(async () => {
    const video = videoRef.current
    if (!video || positionRestoredRef.current || seekingToSavedPositionRef.current) return

    const savedPosition = getSavedPosition()
    if (!savedPosition || savedPosition.currentTime <= 5) return // Only restore if > 5 seconds

    console.log(`🔄 Attempting to restore position: ${savedPosition.currentTime.toFixed(2)}s`)

    try {
      seekingToSavedPositionRef.current = true

      // Wait for video to be ready for seeking
      if (video.readyState < HTMLVideoElement.HAVE_CURRENT_DATA) {
        await new Promise((resolve) => {
          const handleCanPlay = () => {
            video.removeEventListener("canplay", handleCanPlay)
            resolve(void 0)
          }
          video.addEventListener("canplay", handleCanPlay)

          // Timeout after 10 seconds
          setTimeout(() => {
            video.removeEventListener("canplay", handleCanPlay)
            resolve(void 0)
          }, 10000)
        })
      }

      // Find the best seekable position
      const { time: targetTime, reason } = findNearestSeekableTime(savedPosition.currentTime)

      if (targetTime > 0) {
        video.currentTime = targetTime

        // Restore other settings
        if (savedPosition.playbackRate && savedPosition.playbackRate !== video.playbackRate) {
          video.playbackRate = savedPosition.playbackRate
          setPlaybackRate(savedPosition.playbackRate)
        }

        if (savedPosition.volume && savedPosition.volume !== video.volume) {
          video.volume = savedPosition.volume
          setVolume(savedPosition.volume)
        }

        console.log(`✅ Restored position to: ${targetTime.toFixed(2)}s (${reason})`)

        // Show notification if position was adjusted
        if (Math.abs(targetTime - savedPosition.currentTime) > 2) {
          console.log(
            `ℹ️ Position adjusted: requested ${savedPosition.currentTime.toFixed(2)}s, got ${targetTime.toFixed(2)}s`,
          )
        }
      }

      positionRestoredRef.current = true
    } catch (error) {
      console.error("Failed to restore playback position:", error)
    } finally {
      seekingToSavedPositionRef.current = false
    }
  }, [videoRef, getSavedPosition, findNearestSeekableTime])

  // Update buffer chunks tracking
  const updateBufferChunks = useCallback(() => {
    const video = videoRef.current
    if (!video || !video.buffered) return

    const newChunks: BufferChunk[] = []
    const now = Date.now()

    for (let i = 0; i < video.buffered.length; i++) {
      const start = video.buffered.start(i)
      const end = video.buffered.end(i)

      // Create chunks based on chunk size
      let chunkStart = Math.floor(start / chunkSize) * chunkSize
      while (chunkStart < end) {
        const chunkEnd = Math.min(chunkStart + chunkSize, end)
        newChunks.push({
          start: chunkStart,
          end: chunkEnd,
          loaded: true,
          timestamp: now,
        })
        chunkStart += chunkSize
      }
    }

    setBufferChunks(newChunks)
  }, [videoRef, chunkSize])

  // Enhanced play method with promise handling
  const play = useCallback(async () => {
    if (!videoRef.current) return

    try {
      // Cancel any existing play promise
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current
        } catch (error) {
          // Ignore interruption errors
          console.debug("Previous play promise interrupted:", error)
        }
      }

      // Create new play promise
      playPromiseRef.current = videoRef.current.play()
      await playPromiseRef.current
      playPromiseRef.current = null
    } catch (error: any) {
      playPromiseRef.current = null
      if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
        console.error("Play error:", error)
        setError(`Playback failed: ${error.message}`)
      }
    }
  }, [videoRef])

  // Enhanced pause method
  const pause = useCallback(() => {
    if (!videoRef.current) return

    try {
      // Cancel any pending play promise
      if (playPromiseRef.current) {
        playPromiseRef.current = null
      }

      if (!videoRef.current.paused) {
        videoRef.current.pause()
      }
    } catch (error) {
      console.error("Pause error:", error)
    }
  }, [videoRef])

  // Enhanced seek method with smart positioning
  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current
      if (!video || !canSeek) return

      const { time: targetTime, reason } = findNearestSeekableTime(time)

      try {
        video.currentTime = targetTime
        console.log(`⏭️ Seeked to ${targetTime.toFixed(2)}s (${reason})`)
      } catch (error) {
        console.error("Seek error:", error)
      }
    },
    [videoRef, canSeek, findNearestSeekableTime],
  )

  // Volume control
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      if (videoRef.current) {
        const clampedVolume = Math.max(0, Math.min(1, newVolume))
        videoRef.current.volume = clampedVolume
        setVolume(clampedVolume)
        setIsMuted(clampedVolume === 0)
      }
    },
    [videoRef],
  )

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }, [videoRef])

  // Fullscreen control
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await videoRef.current?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Fullscreen error:", error)
    }
  }, [videoRef])

  // Playback rate control
  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      if (videoRef.current && rate > 0) {
        videoRef.current.playbackRate = rate
        setPlaybackRate(rate)
      }
    },
    [videoRef],
  )

  // Picture-in-Picture control
  const togglePiP = useCallback(async () => {
    if (videoRef.current) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
        } else {
          await videoRef.current.requestPictureInPicture()
        }
      } catch (error) {
        console.error("PiP error:", error)
        throw error
      }
    }
  }, [videoRef])

  // Skip controls
  const skipForward = useCallback(
    (seconds: number) => {
      if (videoRef.current) {
        const newTime = Math.min(videoRef.current.currentTime + seconds, videoRef.current.duration || 0)
        seek(newTime)
      }
    },
    [videoRef, seek],
  )

  const skipBackward = useCallback(
    (seconds: number) => {
      if (videoRef.current) {
        const newTime = Math.max(videoRef.current.currentTime - seconds, 0)
        seek(newTime)
      }
    },
    [videoRef, seek],
  )

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadStart = () => {
      setIsLoading(true)
      setError(null)
      console.log("📥 Video loading started")
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
      setIsMetadataLoaded(true)
      setNetworkState(video.networkState)
      setReadyState(video.readyState)
      console.log(`📊 Metadata loaded: ${video.duration.toFixed(2)}s duration`)
    }

    const handleLoadedData = () => {
      setIsLoading(false)
      setCanSeek(true)
      setReadyState(video.readyState)
      console.log("📋 Video data loaded")

      // Restore position after data is loaded
      if (!positionRestoredRef.current) {
        setTimeout(() => {
          restorePlaybackPosition()
        }, 100)
      }
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      setCanSeek(true)
      setReadyState(video.readyState)
    }

    const handleCanPlayThrough = () => {
      setIsLoading(false)
      setCanSeek(true)
      setReadyState(video.readyState)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setIsLoading(false)
      console.log("▶️ Playback started")
    }

    const handlePause = () => {
      setIsPlaying(false)
      console.log("⏸️ Playback paused")
      // Force save position when pausing
      savePlaybackPosition(video.currentTime, true)
    }

    const handleTimeUpdate = () => {
      const time = video.currentTime
      setCurrentTime(time)

      // Save position periodically (with debouncing)
      if (!seekingToSavedPositionRef.current) {
        savePlaybackPosition(time)
      }
    }

    const handleSeeked = () => {
      setIsLoading(false)
      console.log(`⏭️ Seeked to ${video.currentTime.toFixed(2)}s`)
      // Save position after manual seeking
      if (!seekingToSavedPositionRef.current) {
        savePlaybackPosition(video.currentTime, true)
      }
    }

    const handleSeeking = () => {
      setIsLoading(true)
    }

    const handleProgress = () => {
      setBuffered(video.buffered)
      updateBufferChunks()
      setNetworkState(video.networkState)
    }

    const handleWaiting = () => {
      setIsLoading(true)
      console.log("⏳ Buffering...")
    }

    const handlePlaying = () => {
      setIsLoading(false)
      console.log("▶️ Playing after buffering")
    }

    const handleStalled = () => {
      setIsLoading(true)
      console.log("🔄 Network stalled")
    }

    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }

    const handleRateChange = () => {
      setPlaybackRate(video.playbackRate)
    }

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement
      const errorCode = target.error?.code
      const errorMessage = target.error?.message || "Unknown error"

      console.error("❌ Video error:", { code: errorCode, message: errorMessage })
      setIsLoading(false)
      setError(`Video error (${errorCode}): ${errorMessage}`)
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    const handlePiPEnter = () => setIsPiP(true)
    const handlePiPLeave = () => setIsPiP(false)

    // Add all event listeners
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("canplaythrough", handleCanPlayThrough)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("seeked", handleSeeked)
    video.addEventListener("seeking", handleSeeking)
    video.addEventListener("progress", handleProgress)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("playing", handlePlaying)
    video.addEventListener("stalled", handleStalled)
    video.addEventListener("volumechange", handleVolumeChange)
    video.addEventListener("ratechange", handleRateChange)
    video.addEventListener("error", handleError)
    video.addEventListener("enterpictureinpicture", handlePiPEnter)
    video.addEventListener("leavepictureinpicture", handlePiPLeave)

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("canplaythrough", handleCanPlayThrough)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("seeked", handleSeeked)
      video.removeEventListener("seeking", handleSeeking)
      video.removeEventListener("progress", handleProgress)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
      video.removeEventListener("stalled", handleStalled)
      video.removeEventListener("volumechange", handleVolumeChange)
      video.removeEventListener("ratechange", handleRateChange)
      video.removeEventListener("error", handleError)
      video.removeEventListener("enterpictureinpicture", handlePiPEnter)
      video.removeEventListener("leavepictureinpicture", handlePiPLeave)

      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [videoRef, savePlaybackPosition, updateBufferChunks, restorePlaybackPosition])

  // Initialize video source
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    // Reset state for new video
    positionRestoredRef.current = false
    seekingToSavedPositionRef.current = false
    setError(null)
    setIsLoading(true)

    // Set video source and properties
    video.src = src
    video.preload = preloadStrategy
    video.crossOrigin = "anonymous"

    if (autoplay) {
      video.autoplay = true
    }

    console.log(`🎬 Loading video: ${src}`)

    return () => {
      // Cleanup
      if (playPromiseRef.current) {
        playPromiseRef.current = null
      }
    }
  }, [src, videoRef, autoplay, preloadStrategy])

  // Auto-save interval
  useEffect(() => {
    if (!enablePositionSaving) return

    saveIntervalRef.current = setInterval(() => {
      if (videoRef.current && isPlaying && !seekingToSavedPositionRef.current) {
        savePlaybackPosition(videoRef.current.currentTime)
      }
    }, saveInterval)

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }
    }
  }, [enablePositionSaving, isPlaying, saveInterval, savePlaybackPosition, videoRef])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current)
      }

      // Save final position
      if (videoRef.current && enablePositionSaving) {
        savePlaybackPosition(videoRef.current.currentTime, true)
      }
    }
  }, [savePlaybackPosition, enablePositionSaving, videoRef])

  return {
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
    setVolume: handleVolumeChange,
    toggleMute,
    toggleFullscreen,
    setPlaybackRate: handlePlaybackRateChange,
    togglePiP,
    skipForward,
    skipBackward,

    // Position management
    savePlaybackPosition,
    getSavedPosition,
    clearSavedPosition,
    restorePlaybackPosition,
    findNearestSeekableTime,

    // Utils
    sessionId: sessionIdRef.current,
  }
}
