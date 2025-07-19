"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Monitor, Palette, Settings, Volume2, X, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface VideoSource {
  src: string
  type: string
  label: string
  res: number
}

interface EnhancedSettingsMenuProps {
  sources: VideoSource[]
  currentQuality: VideoSource
  playbackRate: number
  brightness: number
  seekDuration: number
  volume: number
  onQualityChange: (quality: VideoSource) => void
  onPlaybackRateChange: (rate: number) => void
  onBrightnessChange: (brightness: number) => void
  onSeekDurationChange: (duration: number) => void
  onVolumeChange: (volume: number) => void
  onClose: () => void
}

type MenuView = "main" | "quality" | "speed" | "display" | "controls" | "audio"

export function EnhancedSettingsMenu({
  sources,
  currentQuality,
  playbackRate,
  brightness,
  seekDuration,
  volume,
  onQualityChange,
  onPlaybackRateChange,
  onBrightnessChange,
  onSeekDurationChange,
  onVolumeChange,
  onClose,
}: EnhancedSettingsMenuProps) {
  const [currentView, setCurrentView] = useState<MenuView>("main")
  const dialogRef = useRef<HTMLDivElement>(null)

  const speedOptions = [
    { label: "0.25x", value: 0.25 },
    { label: "0.5x", value: 0.5 },
    { label: "0.75x", value: 0.75 },
    { label: "Normal", value: 1 },
    { label: "1.25x", value: 1.25 },
    { label: "1.5x", value: 1.5 },
    { label: "1.75x", value: 1.75 },
    { label: "2x", value: 2 },
  ]

  const seekDurationOptions = [
    { label: "5 seconds", value: 5 },
    { label: "10 seconds", value: 10 },
    { label: "15 seconds", value: 15 },
    { label: "30 seconds", value: 30 },
  ]

  const qualityOptions = [
    { label: "Auto", value: sources[0], description: "Adaptive quality" },
    ...sources.map((source) => ({
      label: source.label,
      value: source,
      description: `${source.res}p`,
    })),
  ]

  const handleQualitySelect = (quality: VideoSource) => {
    onQualityChange(quality)
    onClose()
  }

  const handleSpeedSelect = (speed: number) => {
    onPlaybackRateChange(speed)
    setCurrentView("main")
  }

  // Handle clicks outside the dialog
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // যদি click settings menu এর বাইরে হয়, তাহলে close করবো
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])



  const renderMainMenu = () => (
    <div className="space-y-1">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span className="font-medium">Settings</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <button
        onClick={() => setCurrentView("quality")}
        className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors rounded-md mx-1"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Monitor className="h-4 w-4" />
          </div>
          <span>Quality</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{currentQuality.label}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      <button
        onClick={() => setCurrentView("speed")}
        className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors rounded-md mx-1"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4" />
          </div>
          <span>Playback Speed</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {speedOptions.find((s) => s.value === playbackRate)?.label || "Normal"}
          </span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      <button
        onClick={() => setCurrentView("audio")}
        className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors rounded-md mx-1"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Volume2 className="h-4 w-4" />
          </div>
          <span>Audio</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{Math.round(volume * 100)}%</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      <button
        onClick={() => setCurrentView("display")}
        className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors rounded-md mx-1"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Palette className="h-4 w-4" />
          </div>
          <span>Display</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{brightness}%</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>

      <button
        onClick={() => setCurrentView("controls")}
        className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors rounded-md mx-1"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Settings className="h-4 w-4" />
          </div>
          <span>Controls</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{seekDuration}s</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>
    </div>
  )

  const renderQualityMenu = () => (
    <div className="space-y-1">
      <div className="flex items-center p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView("main")} className="mr-2">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">Quality</span>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {qualityOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => handleQualitySelect(option.value)}
            className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors rounded-md mx-1"
          >
            <div className="flex flex-col items-start">
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
            {currentQuality.label === option.value.label && <div className="w-2 h-2 bg-primary rounded-full" />}
          </button>
        ))}
      </div>
    </div>
  )

  const renderSpeedMenu = () => (
    <div className="space-y-1">
      <div className="flex items-center p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView("main")} className="mr-2">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">Playback Speed</span>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {speedOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSpeedSelect(option.value)}
            className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors rounded-md mx-1"
          >
            <span>{option.label}</span>
            {playbackRate === option.value && <div className="w-2 h-2 bg-primary rounded-full" />}
          </button>
        ))}
      </div>
    </div>
  )

  const renderAudioMenu = () => (
    <div className="space-y-1">
      <div className="flex items-center p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView("main")} className="mr-2">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">Audio Settings</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Volume</label>
            <span className="text-sm text-muted-foreground">{Math.round(volume * 100)}%</span>
          </div>
          <Slider
            value={[volume * 100]}
            onValueChange={(value) => onVolumeChange(value[0] / 100)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDisplayMenu = () => (
    <div className="space-y-1">
      <div className="flex items-center p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView("main")} className="mr-2">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">Display Settings</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Brightness</label>
            <span className="text-sm text-muted-foreground">{brightness}%</span>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={(value) => onBrightnessChange(value[0])}
            min={25}
            max={200}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>25%</span>
            <span>200%</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderControlsMenu = () => (
    <div className="space-y-1">
      <div className="flex items-center p-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => setCurrentView("main")} className="mr-2">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">Control Settings</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Double-click Seek Duration</label>
            <span className="text-sm text-muted-foreground">{seekDuration}s</span>
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            Duration for double-click seeking (left/right sides of video)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {seekDurationOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSeekDurationChange(option.value)}
                className={cn(
                  "p-2 text-sm rounded border transition-colors",
                  seekDuration === option.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-accent",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Keyboard Shortcuts</div>
          <div className="text-xs text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
            <div>• Space/K: Play/Pause</div>
            <div>• ←/→: Seek ±{seekDuration}s</div>
            <div>• ↑/↓: Volume ±5%</div>
            <div>• F: Fullscreen</div>
            <div>• M: Mute/Unmute</div>
            <div>• T: Theater Mode</div>
            <div>• P: Picture-in-Picture</div>
            <div>• 0-9: Seek to %</div>
            <div>• N: Next Video</div>
            <div>• B: Previous Video</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div
      ref={dialogRef}
      onClick={(e) => e.stopPropagation()} // inner click এ stopPropagation
      className="fixed bottom-16 right-4 z-90 w-80 bg-background/95 backdrop-blur-sm rounded-lg border shadow-xl animate-in slide-in-from-right-2 duration-300"
    >
      {currentView === "main" && renderMainMenu()}
      {currentView === "quality" && renderQualityMenu()}
      {currentView === "speed" && renderSpeedMenu()}
      {currentView === "audio" && renderAudioMenu()}
      {currentView === "display" && renderDisplayMenu()}
      {currentView === "controls" && renderControlsMenu()}
    </div>

  )
}
