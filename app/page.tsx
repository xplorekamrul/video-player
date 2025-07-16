"use client"

import { useState } from "react"
import { EnhancedVideoPlayer } from "@/components/enhanced-video-player"
import { VideoPlayer } from "@/components/video-player"
import { FileUpload } from "@/components/file-upload"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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

export default function Home() {
  // Sample videos for testing
  const [testVideos] = useState([
    {
      id: "big-buck-bunny",
      title: "Big Buck Bunny",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      poster: "/placeholder.svg?height=720&width=1280",
    },
    {
      id: "elephants-dream",
      title: "Elephants Dream",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      poster: "/placeholder.svg?height=720&width=1280",
    },
    {
      id: "for-bigger-blazes",
      title: "For Bigger Blazes",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      poster: "/placeholder.svg?height=720&width=1280",
    },
    
  ])


  // Regular MP4 playlist for comparison
  const [playlist] = useState<PlaylistItem[]>([
    {
      id: "big-buck-bunny-playlist",
      title: "Big Buck Bunny (Playlist)",
      sources: [
        {
          src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          type: "video/mp4",
          label: "1080p",
          res: 1080,
        },
      ],
      poster: "/placeholder.svg?height=720&width=1280",
      duration: 596,
    },
    {
      id: "elephants-dream-playlist",
      title: "Elephants Dream (Playlist)",
      sources: [
        {
          src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
          type: "video/mp4",
          label: "1080p",
          res: 1080,
        },
      ],
      poster: "/placeholder.svg?height=720&width=1280",
      duration: 653,
    },
  ])

  const [currentTestVideo, setCurrentTestVideo] = useState(testVideos[0])
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0)
  const [currentVideo, setCurrentVideo] = useState<{
    sources: VideoSource[]
    poster?: string
    title: string
    videoId: string
  }>({
    sources: playlist[0].sources,
    poster: playlist[0].poster,
    title: playlist[0].title,
    videoId: playlist[0].id,
  })

  // const handleFileSelect = (file: File) => {
  //   const url = URL.createObjectURL(file)
  //   setCurrentTestVideo({
  //     id: `local-${Date.now()}`,
  //     title: file.name,
  //     src: url,
  //   })
  // }

  const handlePlaylistChange = (index: number) => {
    if (index >= 0 && index < playlist.length) {
      const selectedVideo = playlist[index]
      setCurrentVideo({
        sources: selectedVideo.sources,
        poster: selectedVideo.poster,
        title: selectedVideo.title,
        videoId: selectedVideo.id,
      })
      setCurrentPlaylistIndex(index)
    }
  }

  const handleTestVideoChange = (video: (typeof testVideos)[0]) => {
    setCurrentTestVideo(video)
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background transition-colors">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-foreground"> Video Player</h1>
            <ThemeToggle />

          </div>
          <div className="mb-5">
            <EnhancedVideoPlayer
              key={currentTestVideo.id}
              src={currentTestVideo.src}
              videoId={currentTestVideo.id}
              title={currentTestVideo.title}
              poster={currentTestVideo.poster}
              enablePositionSaving={true}
              saveInterval={3000}
              chunkSize={30}
              playlist={testVideos}
              currentIndex={testVideos.findIndex((v) => v.id === currentTestVideo.id)}
              onVideoChange={(index) => {
                if (index >= 0 && index < testVideos.length) {
                  setCurrentTestVideo(testVideos[index])
                }
              }}
              onError={(error) => console.error("Enhanced Player Error:", error)}
              onPositionRestore={(time) => console.log("Position restored to:", time)}
            />
          </div>

          {/* <div className="mb-6">
            <FileUpload onFileSelect={handleFileSelect} />
          </div> */}

          {/* <Tabs defaultValue="enhanced" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="enhanced">Enhanced Player</TabsTrigger>
              <TabsTrigger value="regular">Regular Player</TabsTrigger>
            </TabsList>

            <TabsContent value="enhanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enhanced Video Player</CardTitle>
                  <CardDescription>
                    Features session-based position tracking, smart seeking, advanced buffer management, and functional
                    settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {testVideos.map((video, index) => (
                      <Button
                        key={video.id}
                        variant={currentTestVideo.id === video.id ? "default" : "outline"}
                        onClick={() => handleTestVideoChange(video)}
                        className="h-auto p-4 text-left"
                      >
                        <div>
                          <div className="font-medium">{video.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Video {index + 1} of {testVideos.length}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>

                  <EnhancedVideoPlayer
                    key={currentTestVideo.id}
                    src={currentTestVideo.src}
                    videoId={currentTestVideo.id}
                    title={currentTestVideo.title}
                    poster={currentTestVideo.poster}
                    enablePositionSaving={true}
                    saveInterval={3000}
                    chunkSize={30}
                    playlist={testVideos}
                    currentIndex={testVideos.findIndex((v) => v.id === currentTestVideo.id)}
                    onVideoChange={(index) => {
                      if (index >= 0 && index < testVideos.length) {
                        setCurrentTestVideo(testVideos[index])
                      }
                    }}
                    onError={(error) => console.error("Enhanced Player Error:", error)}
                    onPositionRestore={(time) => console.log("Position restored to:", time)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enhanced Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium text-base">Session Management</h4>
                      <div>✅ Dual storage (session + persistent)</div>
                      <div>✅ Smart position validation</div>
                      <div>✅ Session ID tracking</div>
                      <div>✅ Auto-cleanup of old data</div>
                      <div>✅ Debounced saving (3s interval)</div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-base">Smart Seeking</h4>
                      <div>✅ Buffer-aware seeking</div>
                      <div>✅ Nearest keyframe detection</div>
                      <div>✅ Fallback to safe positions</div>
                      <div>✅ Seekable range validation</div>
                      <div>✅ Intelligent error recovery</div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-base">Buffer Management</h4>
                      <div>✅ Chunk-based tracking (30s chunks)</div>
                      <div>✅ Real-time buffer monitoring</div>
                      <div>✅ Network state awareness</div>
                      <div>✅ Progressive loading</div>
                      <div>✅ Stall detection & recovery</div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-base">Enhanced Controls</h4>
                      <div>✅ Functional settings menu</div>
                      <div>✅ Click-outside menu closing</div>
                      <div>✅ Next/Previous navigation</div>
                      <div>✅ Fullscreen control panel</div>
                      <div>✅ Keyboard shortcuts (N/B)</div>
                      <div>✅ Enhanced button styling</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="regular" className="space-y-6">
              {currentPlaylistIndex >= 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">Now Playing</h3>
                        <p className="text-sm text-muted-foreground">
                          Video {currentPlaylistIndex + 1} of {playlist.length} in playlist
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{currentVideo.title}</p>
                        <p className="text-xs text-muted-foreground">Regular Playback Mode</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <VideoPlayer
                key={currentVideo.videoId}
                sources={currentVideo.sources}
                poster={currentVideo.poster}
                title={currentVideo.title}
                videoId={currentVideo.videoId}
                watermark="/placeholder.svg?height=40&width=120"
                playlist={playlist}
                currentPlaylistIndex={currentPlaylistIndex >= 0 ? currentPlaylistIndex : 0}
                onPlaylistChange={handlePlaylistChange}
              />
            </TabsContent>
          </Tabs> */}

          {/* <Card className="mt-8">
            <CardHeader>
              <CardTitle>Technical Implementation Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-base">Position Tracking Architecture</h4>
                  <div>
                    • <strong>Dual Storage Strategy:</strong> SessionStorage for temporary, LocalStorage for persistent
                  </div>
                  <div>
                    • <strong>Debounced Saving:</strong> Prevents excessive writes with 1s debounce + 3s interval
                  </div>
                  <div>
                    • <strong>Smart Validation:</strong> Checks position validity, age, and video compatibility
                  </div>
                  <div>
                    • <strong>Session Management:</strong> Unique session IDs for tracking multiple instances
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-base">Buffer & Seek Management</h4>
                  <div>
                    • <strong>Chunk Tracking:</strong> 30-second chunks with load status monitoring
                  </div>
                  <div>
                    • <strong>Smart Seeking:</strong> Finds nearest seekable/buffered position automatically
                  </div>
                  <div>
                    • <strong>Fallback Strategy:</strong> Multiple fallback levels for failed seeks
                  </div>
                  <div>
                    • <strong>Buffer Awareness:</strong> Real-time monitoring of buffer state and network conditions
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Key Improvements Over Standard Player</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Enhanced Position Persistence:</strong> Survives page reloads, browser crashes, and
                    maintains accuracy across sessions
                  </div>
                  <div>
                    <strong>Intelligent Seeking:</strong> Automatically handles unbuffered positions and finds optimal
                    seek targets
                  </div>
                  <div>
                    <strong>Advanced Error Recovery:</strong> Graceful handling of network issues, codec problems, and
                    playback interruptions
                  </div>
                  <div>
                    <strong>Performance Optimized:</strong> Minimal storage writes, efficient event handling, and smart
                    buffer management
                  </div>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </ThemeProvider>
  )
}
