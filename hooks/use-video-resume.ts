"use client"

import { useCallback } from "react"

export function useVideoResume(videoId: string) {
  const saveProgress = useCallback(
    (currentTime: number) => {
      try {
        if (currentTime > 0 && isFinite(currentTime)) {
          localStorage.setItem(`video-progress-${videoId}`, currentTime.toString())
        }
      } catch (error) {
        console.error("Failed to save video progress:", error)
      }
    },
    [videoId],
  )

  const getLastPosition = useCallback(() => {
    try {
      const saved = localStorage.getItem(`video-progress-${videoId}`)
      return saved ? Number.parseFloat(saved) : 0
    } catch (error) {
      console.error("Failed to get video progress:", error)
      return 0
    }
  }, [videoId])

  const clearProgress = useCallback(() => {
    try {
      localStorage.removeItem(`video-progress-${videoId}`)
    } catch (error) {
      console.error("Failed to clear video progress:", error)
    }
  }, [videoId])

  return {
    saveProgress,
    getLastPosition,
    clearProgress,
  }
}
