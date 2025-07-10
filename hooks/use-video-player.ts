"use client"

import { useState, useEffect, useCallback, type RefObject } from "react"

export function useVideoPlayer(videoRef: RefObject<HTMLVideoElement>) {
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
  const [playPromise, setPlayPromise] = useState<Promise<void> | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [lastPlayTime, setLastPlayTime] = useState(0) // Track last play attempt

  const play = useCallback(async () => {
    if (!videoRef.current || isTransitioning) return

    const now = Date.now()
    // Prevent rapid play/pause calls
    if (now - lastPlayTime < 100) return

    try {
      setIsTransitioning(true)
      setLastPlayTime(now)

      // Wait for any pending play promise to resolve/reject
      if (playPromise) {
        try {
          await playPromise
        } catch (error) {
          // Ignore errors from previous play attempts
          console.debug("Previous play promise rejected:", error)
        }
      }

      // Check if video is already playing or if it's in a state where play would fail
      if (!videoRef.current.paused || videoRef.current.ended) {
        setIsTransitioning(false)
        return
      }

      // Ensure video is ready to play
      if (videoRef.current.readyState < 2) {
        await new Promise((resolve) => {
          const handleCanPlay = () => {
            videoRef.current?.removeEventListener("canplay", handleCanPlay)
            resolve(void 0)
          }
          videoRef.current?.addEventListener("canplay", handleCanPlay)
        })
      }

      // Create new play promise
      const promise = videoRef.current.play()
      setPlayPromise(promise)

      await promise
      setPlayPromise(null)
      setIsTransitioning(false)
    } catch (error: any) {
      setPlayPromise(null)
      setIsTransitioning(false)

      // Only log if it's not an expected interruption
      if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
        console.error("Play error:", error)
      }
    }
  }, [videoRef, playPromise, isTransitioning, lastPlayTime])

  const pause = useCallback(() => {
    if (!videoRef.current || isTransitioning) return

    try {
      setIsTransitioning(true)

      // Cancel any pending play promise
      if (playPromise) {
        setPlayPromise(null)
      }

      // Only pause if not already paused
      if (!videoRef.current.paused) {
        videoRef.current.pause()
      }

      setIsTransitioning(false)
    } catch (error) {
      setIsTransitioning(false)
      console.error("Pause error:", error)
    }
  }, [videoRef, playPromise, isTransitioning])

  const seek = useCallback(
    (time: number) => {
      if (videoRef.current && isFinite(time) && !isTransitioning) {
        try {
          const clampedTime = Math.max(0, Math.min(time, videoRef.current.duration || 0))
          // Avoid seeking to exactly 240 seconds (4 minutes) to prevent restart issue
          const adjustedTime = Math.abs(clampedTime - 240) < 0.1 ? clampedTime + 0.5 : clampedTime
          videoRef.current.currentTime = adjustedTime
        } catch (error) {
          console.error("Seek error:", error)
        }
      }
    },
    [videoRef, isTransitioning],
  )

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      if (videoRef.current && !isTransitioning) {
        try {
          const clampedVolume = Math.max(0, Math.min(1, newVolume))
          videoRef.current.volume = clampedVolume
          setVolume(clampedVolume)
          setIsMuted(clampedVolume === 0)
        } catch (error) {
          console.error("Volume change error:", error)
        }
      }
    },
    [videoRef, isTransitioning],
  )

  const toggleMute = useCallback(() => {
    if (videoRef.current && !isTransitioning) {
      try {
        const newMuted = !videoRef.current.muted
        videoRef.current.muted = newMuted
        setIsMuted(newMuted)
      } catch (error) {
        console.error("Mute toggle error:", error)
      }
    }
  }, [videoRef, isTransitioning])

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

  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      if (videoRef.current && rate > 0) {
        videoRef.current.playbackRate = rate
        setPlaybackRate(rate)
      }
    },
    [videoRef],
  )

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

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      setBuffered(video.buffered)
    }
    const handleDurationChange = () => setDuration(video.duration)
    const handleVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }
    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleWaiting = () => setIsLoading(true)
    const handlePlaying = () => setIsLoading(false)
    const handleRateChange = () => setPlaybackRate(video.playbackRate)
    const handleProgress = () => setBuffered(video.buffered)

    // Add loadedmetadata handler to reset states
    const handleLoadedMetadata = () => {
      setCurrentTime(0)
      setDuration(video.duration)
      setIsLoading(false)
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    const handlePiPEnter = () => setIsPiP(true)
    const handlePiPLeave = () => setIsPiP(false)

    // Video events
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("loadedmetadata", handleLoadedMetadata) // Add this
    video.addEventListener("volumechange", handleVolumeChange)
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("playing", handlePlaying)
    video.addEventListener("ratechange", handleRateChange)
    video.addEventListener("progress", handleProgress)
    video.addEventListener("enterpictureinpicture", handlePiPEnter)
    video.addEventListener("leavepictureinpicture", handlePiPLeave)

    // Document events
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata) // Add this
      video.removeEventListener("volumechange", handleVolumeChange)
      video.removeEventListener("loadstart", handleLoadStart)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("playing", handlePlaying)
      video.removeEventListener("ratechange", handleRateChange)
      video.removeEventListener("progress", handleProgress)
      video.removeEventListener("enterpictureinpicture", handlePiPEnter)
      video.removeEventListener("leavepictureinpicture", handlePiPLeave)

      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [videoRef])

  return {
    // state
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
    playPromise,
    isTransitioning,
    // actions
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
  }
}
