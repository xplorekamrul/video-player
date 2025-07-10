"use client"

import { useEffect } from "react"

interface InternationalKeyboardShortcutsProps {
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
  onOpenSettings: () => void
  currentTime: number
  duration: number
  volume: number
  seekDuration: number
  isEnabled: boolean
}

export function useInternationalKeyboardShortcuts({
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
  onOpenSettings,
  currentTime,
  duration,
  volume,
  seekDuration,
  isEnabled,
}: InternationalKeyboardShortcutsProps) {
  useEffect(() => {
    if (!isEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input or textarea
      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return
      }

      // Get the key without modifiers for international support
      const key = e.key.toLowerCase()
      const code = e.code.toLowerCase()

      // International keyboard shortcuts mapping
      const shortcuts = {
        // Play/Pause - Multiple international variants
        playPause: [" ", "space", "k", "enter", "return", "mediaplaypause", "audioplay", "audiopause"],

        // Seeking - Arrow keys and international variants
        seekBackward: ["arrowleft", "left", "j", "h", "numpad4", "digit4", "key4"],
        seekForward: ["arrowright", "right", "l", "semicolon", "numpad6", "digit6", "key6"],

        // Volume - Arrow keys and international variants
        volumeUp: ["arrowup", "up", "plus", "equal", "numpadadd", "numpad8", "digit8", "key8"],
        volumeDown: ["arrowdown", "down", "minus", "numpadsubtract", "numpad2", "digit2", "key2"],

        // Mute - Multiple international variants
        mute: ["m", "audiomute", "volumemute"],

        // Fullscreen - Multiple variants
        fullscreen: ["f", "f11", "escape"],

        // Theater mode
        theater: ["t", "w"],

        // Picture-in-Picture
        pip: ["p", "i"],

        // Navigation
        next: ["n", "pagedown", "medianexttrack", "audionext"],
        previous: ["b", "pageup", "mediaprevioustrack", "audioprevious"],

        // Speed control
        speedDecrease: ["comma", "less", "numpadsubtract"],
        speedIncrease: ["period", "greater", "numpadadd"],
        speedReset: ["backspace", "delete", "numpad0"],

        // Seeking to percentage
        seekToPercent: [
          "digit0",
          "digit1",
          "digit2",
          "digit3",
          "digit4",
          "digit5",
          "digit6",
          "digit7",
          "digit8",
          "digit9",
          "numpad0",
          "numpad1",
          "numpad2",
          "numpad3",
          "numpad4",
          "numpad5",
          "numpad6",
          "numpad7",
          "numpad8",
          "numpad9",
        ],

        // Settings
        settings: ["s", "o", "contextmenu"],

        // Home/End seeking
        seekToStart: ["home", "numpad7"],
        seekToEnd: ["end", "numpad1"],
      }

      // Prevent default for recognized shortcuts
      const allShortcuts = Object.values(shortcuts).flat()
      if (allShortcuts.includes(key) || allShortcuts.includes(code)) {
        e.preventDefault()
        e.stopPropagation()
      }

      // Handle shortcuts
      if (shortcuts.playPause.includes(key) || shortcuts.playPause.includes(code)) {
        onPlayPause()
      } else if (shortcuts.seekBackward.includes(key) || shortcuts.seekBackward.includes(code)) {
        onSkipBackward()
      } else if (shortcuts.seekForward.includes(key) || shortcuts.seekForward.includes(code)) {
        onSkipForward()
      } else if (shortcuts.volumeUp.includes(key) || shortcuts.volumeUp.includes(code)) {
        onVolumeChange(Math.min(1, volume + 0.05))
      } else if (shortcuts.volumeDown.includes(key) || shortcuts.volumeDown.includes(code)) {
        onVolumeChange(Math.max(0, volume - 0.05))
      } else if (shortcuts.mute.includes(key) || shortcuts.mute.includes(code)) {
        onToggleMute()
      } else if (shortcuts.fullscreen.includes(key) || shortcuts.fullscreen.includes(code)) {
        if (key === "escape" && document.fullscreenElement) {
          onToggleFullscreen()
        } else if (key !== "escape") {
          onToggleFullscreen()
        }
      } else if (shortcuts.theater.includes(key) || shortcuts.theater.includes(code)) {
        onToggleTheater()
      } else if (shortcuts.pip.includes(key) || shortcuts.pip.includes(code)) {
        onTogglePiP()
      } else if (shortcuts.next.includes(key) || shortcuts.next.includes(code)) {
        onNextVideo()
      } else if (shortcuts.previous.includes(key) || shortcuts.previous.includes(code)) {
        onPreviousVideo()
      } else if (shortcuts.speedDecrease.includes(key) || shortcuts.speedDecrease.includes(code)) {
        onSpeedChange(0.75)
      } else if (shortcuts.speedIncrease.includes(key) || shortcuts.speedIncrease.includes(code)) {
        onSpeedChange(1.25)
      } else if (shortcuts.speedReset.includes(key) || shortcuts.speedReset.includes(code)) {
        onSpeedChange(1)
      } else if (shortcuts.settings.includes(key) || shortcuts.settings.includes(code)) {
        onOpenSettings()
      } else if (shortcuts.seekToStart.includes(key) || shortcuts.seekToStart.includes(code)) {
        onSeek(0)
      } else if (shortcuts.seekToEnd.includes(key) || shortcuts.seekToEnd.includes(code)) {
        onSeek(duration - 5)
      } else if (shortcuts.seekToPercent.includes(code) && duration > 0) {
        // Extract number from code (e.g., 'digit1' -> '1', 'numpad5' -> '5')
        const match = code.match(/(\d)/)
        if (match) {
          const percentage = Number.parseInt(match[1]) * 10
          const seekTime = (percentage / 100) * duration
          onSeek(seekTime)
        }
      }
    }

    // Also handle media keys
    const handleMediaKeys = (e: KeyboardEvent) => {
      switch (e.key) {
        case "MediaPlayPause":
          e.preventDefault()
          onPlayPause()
          break
        case "MediaTrackNext":
          e.preventDefault()
          onNextVideo()
          break
        case "MediaTrackPrevious":
          e.preventDefault()
          onPreviousVideo()
          break
        case "AudioVolumeUp":
          e.preventDefault()
          onVolumeChange(Math.min(1, volume + 0.1))
          break
        case "AudioVolumeDown":
          e.preventDefault()
          onVolumeChange(Math.max(0, volume - 0.1))
          break
        case "AudioVolumeMute":
          e.preventDefault()
          onToggleMute()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown, { capture: true })
    document.addEventListener("keydown", handleMediaKeys, { capture: true })

    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true })
      document.removeEventListener("keydown", handleMediaKeys, { capture: true })
    }
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
    onOpenSettings,
    currentTime,
    duration,
    volume,
    seekDuration,
  ])
}
