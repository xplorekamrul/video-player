"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Play, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    //playList Menu Dailoug
    <div className="absolute bottom-16 right-4 w-96 max-h-96 bg-background/95 backdrop-blur-sm rounded-lg border shadow-xl z-50 animate-in slide-in-from-right-2 duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Play className="h-4 w-4" />
          <span className="font-medium">Playlist</span>
          <span className="text-sm text-muted-foreground">({playlist.length} videos)</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="max-h-80">
        <div className="p-2 space-y-1">
          {playlist.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onSelectVideo(index)}
              className={cn(
                "w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent",
                index === currentIndex && "bg-primary/10 border border-primary/20",
              )}
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-9 bg-muted rounded overflow-hidden flex-shrink-0">
                {item.poster ? (
                  <img
                    src={item.poster || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}

                {/* Current playing indicator */}
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
                  {index === currentIndex && <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />}
                </div>
                <h4 className={cn("font-medium text-sm truncate", index === currentIndex && "text-primary")}>
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
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
