"use client"

import type React from "react"
import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Play, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/tooltip"

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

interface PlaylistMenuProps {
  playlist: PlaylistItem[]
  currentIndex: number
  onSelectVideo: (index: number) => void
  onClose: () => void
}

export function PlaylistMenu({ playlist, currentIndex, onSelectVideo, onClose }: PlaylistMenuProps) {
  const formatDuration = useCallback((seconds?: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }, [])

  const handleSelectVideo = useCallback(
    (index: number) => (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      onSelectVideo(index)
    },
    [onSelectVideo]
  )

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onClose()
    },
    [onClose]
  )

  return (
    <TooltipProvider delayDuration={100}>
      <div
        className="absolute inset-0 flex items-end justify-end bg-black/80 backdrop-blur-sm z-50"
        onClick={handleClose}
      >
        <div
          className={cn(
            "relative bg-background/95 backdrop-blur-md rounded-lg border border-border shadow-xl",
            "w-full max-w-md m-4 sm:m-6",
            "max-h-[80vh] animate-in slide-in-from-right-2 duration-300"
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-labelledby="playlist-title"
          aria-modal="true"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-primary" />
              <span id="playlist-title" className="font-medium text-foreground">
                Playlist
              </span>
              <span className="text-sm text-muted-foreground">({playlist.length} videos)</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-foreground hover:bg-accent"
                  aria-label="Close playlist"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <div className="p-2 space-y-1">
              {playlist.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center p-4">
                  No videos in playlist
                </p>
              ) : (
                playlist.map((item, index) => (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleSelectVideo(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleSelectVideo(index)(e)
                          }
                        }}
                        className={cn(
                          "w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent",
                          index === currentIndex && "bg-primary/10 border border-primary/20",
                          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                        )}
                        role="button"
                        aria-current={index === currentIndex ? "true" : "false"}
                        aria-label={`Play ${item.title}`}
                        tabIndex={0}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-16 h-9 bg-muted rounded overflow-hidden flex-shrink-0">
                          {item.poster ? (
                            <img
                              src={item.poster}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                              <Play className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          {index === currentIndex && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            </div>
                          )}
                        </div>

                        {/* Video Info */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground font-mono">
                              {(index + 1).toString().padStart(2, "0")}
                            </span>
                            {index === currentIndex && (
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                            )}
                          </div>
                          <h4
                            className={cn(
                              "font-medium text-sm truncate max-w-[200px] sm:max-w-[250px]",
                              index === currentIndex && "text-primary"
                            )}
                          >
                            {item.title}
                          </h4>
                          {item.duration && (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(item.duration)}</span>
                            </div>
                          )}
                        </div>

                        {/* Play indicator */}
                        {index === currentIndex && (
                          <div className="flex-shrink-0">
                            <Play className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{item.title}</TooltipContent>
                  </Tooltip>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </TooltipProvider>
  )
}