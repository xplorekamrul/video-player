"use client"

import { useEffect } from "react"

interface KeyboardShortcutsProps {
  onPlayPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
  onSpeedChange: (rate: number) => void
  onSkipForward: () => void
  onSkipBackward: () => void
  onToggleTheater: () => void
  onTogglePiP: () => void
  onNextVideo: () => void
  onPreviousVideo: () => void
  currentTime: number
  duration: number
  volume: number
  seekDuration: number
  isEnabled: boolean
}

export function useKeyboardShortcuts({
  onPlayPause,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onSpeedChange,
  onSkipForward,
  onSkipBackward,
  onToggleTheater,
  onTogglePiP,
  onNextVideo,
  onPreviousVideo,
  currentTime,
  duration,
  volume,
  seekDuration,
  isEnabled,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!isEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Prevent default for video-specific shortcuts
      const videoKeys = [
        " ",
        "k",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "f",
        "m",
        "t",
        "p",
        "n",
        "b",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "<",
        ">",
        ",",
        ".",
      ]

      if (videoKeys.includes(e.key)) {
        e.preventDefault()
      }

      switch (e.key) {
        case " ":
        case "k":
          onPlayPause()
          break
        case "ArrowLeft":
          onSkipBackward()
          break
        case "ArrowRight":
          onSkipForward()
          break
        case "ArrowUp":
          onVolumeChange(Math.min(1, volume + 0.05))
          break
        case "ArrowDown":
          onVolumeChange(Math.max(0, volume - 0.05))
          break
        case "f":
          onToggleFullscreen()
          break
        case "m":
          onToggleMute()
          break
        case "t":
          onToggleTheater()
          break
        case "p":
          onTogglePiP()
          break
        case "n":
          onNextVideo()
          break
        case "b":
          onPreviousVideo()
          break
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          if (duration > 0) {
            const percentage = Number.parseInt(e.key) * 10
            const seekTime = (percentage / 100) * duration
            onSeek(seekTime)
          }
          break
        case "<":
        case ",":
          onSpeedChange(0.5)
          break
        case ">":
        case ".":
          onSpeedChange(2)
          break
        case "j":
          onSkipBackward()
          break
        case "l":
          onSkipForward()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [
    isEnabled,
    onPlayPause,
    onSeek,
    onVolumeChange,
    onToggleMute,
    onToggleFullscreen,
    onSpeedChange,
    onSkipForward,
    onSkipBackward,
    onToggleTheater,
    onTogglePiP,
    onNextVideo,
    onPreviousVideo,
    currentTime,
    duration,
    volume,
    seekDuration,
  ])
}
