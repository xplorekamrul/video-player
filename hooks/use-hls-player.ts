"use client"

import { useState, useEffect, useCallback, useRef, type RefObject } from "react"
import Hls from "hls.js"

interface HLSPlayerOptions {
  videoRef: RefObject<HTMLVideoElement>
  src: string
  videoId: string
  autoplay?: boolean
  enablePositionSaving?: boolean
  saveInterval?: number
  hlsConfig?: Partial<Hls["config"]>
}

interface PlaybackPosition {
  videoId: string
  currentTime: number
  duration: number
  timestamp: number
  bufferedRanges: Array<{ start: number; end: number }>
}

export function useHLSPlayer({
  videoRef,
  src,
  videoId,
  autoplay = false,
  enablePositionSaving = true,
  saveInterval = 5000,
  hlsConfig = {},
}: HLSPlayerOptions) {
  const [hls, setHls] = useState<Hls | null>(null)
  const [isHLSSupported, setIsHLSSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState<TimeRanges | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [canSeek, setCanSeek] = useState(false)

  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);
  const lastSavedTimeRef = useRef(0)
  const positionRestoredRef = useRef(false)
  const seekingToSavedPositionRef = useRef(false)

  // Storage keys
  const getStorageKey = useCallback((id: string) => `video_position_${id}`, [])
  const getSessionKey = useCallback((id: string) => `video_session_${id}`, [])

  // Save playback position with debouncing
  const savePlaybackPosition = useCallback(
    (time: number, force = false) => {
      if (!enablePositionSaving || !videoRef.current) return

      const video = videoRef.current
      const now = Date.now()

      // Debounce saving (don't save too frequently unless forced)
      if (!force && Math.abs(time - lastSavedTimeRef.current) < 2) return

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
            }

            // Save to both localStorage (persistent) and sessionStorage (session-based)
            localStorage.setItem(getStorageKey(videoId), JSON.stringify(position))
            sessionStorage.setItem(getSessionKey(videoId), JSON.stringify(position))

            lastSavedTimeRef.current = time
            console.log(`Saved position: ${time.toFixed(2)}s for video ${videoId}`)
          } catch (error) {
            console.error("Failed to save playback position:", error)
          }
        },
        force ? 0 : 1000,
      ) // Immediate save if forced, otherwise debounce
    },
    [videoId, enablePositionSaving, getStorageKey, getSessionKey, videoRef],
  )

  // Get saved playback position
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
        // Check if position is not too old (older than 7 days)
        const isOld = Date.now() - position.timestamp > 7 * 24 * 60 * 60 * 1000
        if (!isOld) {
          return position
        }
      }
    } catch (error) {
      console.error("Failed to get saved position:", error)
    }
    return null
  }, [videoId, getStorageKey, getSessionKey])

  // Clear saved position
  const clearSavedPosition = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(videoId))
      sessionStorage.removeItem(getSessionKey(videoId))
      lastSavedTimeRef.current = 0
      console.log(`Cleared saved position for video ${videoId}`)
    } catch (error) {
      console.error("Failed to clear saved position:", error)
    }
  }, [videoId, getStorageKey, getSessionKey])

  // Find nearest seekable time
  const findNearestSeekableTime = useCallback(
    (targetTime: number): number => {
      const video = videoRef.current
      if (!video || !video.seekable || video.seekable.length === 0) {
        return 0
      }

      // Find the seekable range that contains or is closest to the target time
      for (let i = 0; i < video.seekable.length; i++) {
        const start = video.seekable.start(i)
        const end = video.seekable.end(i)

        if (targetTime >= start && targetTime <= end) {
          return targetTime // Target time is within seekable range
        }

        if (targetTime < start) {
          return start // Target is before this range, use range start
        }
      }

      // If target is after all ranges, use the end of the last range
      const lastIndex = video.seekable.length - 1
      return video.seekable.end(lastIndex)
    },
    [videoRef],
  )

  // Restore playback position with smart seeking
  const restorePlaybackPosition = useCallback(async () => {
    const video = videoRef.current
    if (!video || positionRestoredRef.current || seekingToSavedPositionRef.current) return

    const savedPosition = getSavedPosition()
    if (!savedPosition || savedPosition.currentTime <= 0) return

    console.log(`Attempting to restore position: ${savedPosition.currentTime.toFixed(2)}s`)

    try {
      seekingToSavedPositionRef.current = true

      // Wait for video to be ready for seeking
      if (video.readyState < 2) {
        await new Promise((resolve) => {
          const handleCanPlay = () => {
            video.removeEventListener("canplay", handleCanPlay)
            resolve(void 0)
          }
          video.addEventListener("canplay", handleCanPlay)
        })
      }

      // Find the nearest seekable time
      const targetTime = findNearestSeekableTime(savedPosition.currentTime)

      if (targetTime > 0) {
        video.currentTime = targetTime
        console.log(`Restored position to: ${targetTime.toFixed(2)}s`)

        // If we couldn't seek to exact position, show a notification
        if (Math.abs(targetTime - savedPosition.currentTime) > 5) {
          console.log(
            `Note: Seeked to nearest available position (${targetTime.toFixed(2)}s instead of ${savedPosition.currentTime.toFixed(2)}s)`,
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

  // Initialize HLS
  const initializeHLS = useCallback(() => {
    const video = videoRef.current
    if (!video || !src) return

    setError(null)
    setIsLoading(true)

    // Check HLS support
    const hlsSupported = Hls.isSupported()
    setIsHLSSupported(hlsSupported)

    if (hlsSupported) {
      // Create HLS instance with optimized config for chunked playback
      const hlsInstance = new Hls({
        // Optimize for chunked loading
        maxBufferLength: 30, // Buffer 30 seconds ahead
        maxMaxBufferLength: 60, // Maximum buffer length
        maxBufferSize: 60 * 1000 * 1000, // 60MB buffer size
        maxBufferHole: 0.5, // Max buffer hole tolerance

        // Optimize loading
        lowLatencyMode: false,
        backBufferLength: 10, // Keep 10 seconds of back buffer

        // Fragment loading optimization
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 10000,

        // Enable auto start load
        autoStartLoad: true,
        startPosition: -1,

        // Custom config overrides
        ...hlsConfig,
      })

      // HLS event handlers
      hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("HLS: Media attached")
      })

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("HLS: Manifest parsed, levels:", data.levels.length)
        setIsLoading(false)
        setCanSeek(true)

        // Auto-play if enabled
        if (autoplay) {
          setTimeout(() => {
            video.play().catch(console.error)
          }, 100)
        }

        // Restore position after manifest is loaded
        setTimeout(() => {
          restorePlaybackPosition()
        }, 200)
      })

      hlsInstance.on(Hls.Events.LEVEL_LOADED, () => {
        setIsLoading(false)
      })

      hlsInstance.on(Hls.Events.FRAG_LOADED, (event, data) => {
        // Fragment loaded - update buffer info
        setBuffered(video.buffered)
        setIsLoading(false)
      })

      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data)

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError("Network error occurred while loading video")
              console.log("Trying to recover from network error...")
              hlsInstance.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Media error occurred")
              console.log("Trying to recover from media error...")
              hlsInstance.recoverMediaError()
              break
            default:
              setError("Fatal error occurred")
              hlsInstance.destroy()
              break
          }
        }
      })

      // Attach media and load source
      hlsInstance.attachMedia(video)
      hlsInstance.loadSource(src)

      setHls(hlsInstance)
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      console.log("Using native HLS support")
      video.src = src

      const handleLoadedData = () => {
        setIsLoading(false)
        setCanSeek(true)
        video.removeEventListener("loadeddata", handleLoadedData)

        // Auto-play if enabled
        if (autoplay) {
          video.play().catch(console.error)
        }

        // Restore position for native HLS
        setTimeout(() => {
          restorePlaybackPosition()
        }, 200)
      }

      video.addEventListener("loadeddata", handleLoadedData)
    } else {
      setError("HLS is not supported in this browser")
      setIsLoading(false)
    }
  }, [videoRef, src, hlsConfig, restorePlaybackPosition, autoplay])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const time = video.currentTime
      setCurrentTime(time)

      // Save position periodically (with debouncing)
      if (!seekingToSavedPositionRef.current) {
        savePlaybackPosition(time)
      }
    }

    const handleDurationChange = () => {
      setDuration(video.duration)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      setIsLoading(false) // Clear loading when playing
    }

    const handlePause = () => {
      setIsPlaying(false)
      // Force save position when pausing
      savePlaybackPosition(video.currentTime, true)
    }

    const handleSeeked = () => {
      setIsLoading(false) // Clear loading after seek
      // Save position after manual seeking
      if (!seekingToSavedPositionRef.current) {
        savePlaybackPosition(video.currentTime, true)
      }
    }

    const handleProgress = () => {
      setBuffered(video.buffered)
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      setCanSeek(true)
    }

    const handleCanPlayThrough = () => {
      setIsLoading(false)
      setCanSeek(true)
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handlePlaying = () => {
      setIsLoading(false)
    }

    const handleLoadedData = () => {
      setIsLoading(false)
      setCanSeek(true)
    }

    const handleError = (e: Event) => {
      console.error("Video error:", e)
      setIsLoading(false)
      setError("Failed to load video")
    }

    // Add event listeners
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("seeked", handleSeeked)
    video.addEventListener("progress", handleProgress)
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("canplaythrough", handleCanPlayThrough)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("playing", handlePlaying)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("error", handleError)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("seeked", handleSeeked)
      video.removeEventListener("progress", handleProgress)
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("canplaythrough", handleCanPlayThrough)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("error", handleError)
    }
  }, [videoRef, savePlaybackPosition])

  // Initialize HLS when src changes
  useEffect(() => {
    if (src) {
      // Reset position restoration flag for new video
      positionRestoredRef.current = false
      seekingToSavedPositionRef.current = false

      // Clean up previous HLS instance
      if (hls) {
        hls.destroy()
        setHls(null)
      }

      initializeHLS()
    }

    return () => {
      if (hls) {
        hls.destroy()
        setHls(null)
      }
    }
  }, [src]) // Remove initializeHLS from dependencies to avoid infinite loop

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Save final position
      if (videoRef.current && enablePositionSaving) {
        savePlaybackPosition(videoRef.current.currentTime, true)
      }
    }
  }, [savePlaybackPosition, enablePositionSaving, videoRef])

  // Auto-save position periodically
  useEffect(() => {
    if (!enablePositionSaving) return

    const interval = setInterval(() => {
      if (videoRef.current && isPlaying) {
        savePlaybackPosition(videoRef.current.currentTime)
      }
    }, saveInterval)

    return () => clearInterval(interval)
  }, [enablePositionSaving, isPlaying, saveInterval, savePlaybackPosition, videoRef])

  // Play/Pause methods
  const play = useCallback(async () => {
    if (!videoRef.current) return

    try {
      await videoRef.current.play()
    } catch (error) {
      console.error("Play error:", error)
    }
  }, [videoRef])

  const pause = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.pause()
  }, [videoRef])

  // Seek method with smart seeking
  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current
      if (!video || !canSeek) return

      const targetTime = findNearestSeekableTime(time)
      video.currentTime = targetTime
    },
    [videoRef, canSeek, findNearestSeekableTime],
  )

  return {
    // State
    isHLSSupported,
    isLoading,
    error,
    currentTime,
    duration,
    buffered,
    isPlaying,
    canSeek,
    hls,

    // Methods
    play,
    pause,
    seek,
    savePlaybackPosition,
    getSavedPosition,
    clearSavedPosition,
    restorePlaybackPosition,

    // Utils
    findNearestSeekableTime,
  }
}
