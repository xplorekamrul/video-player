"use client"

import { useState } from "react"
import { VideoPlayer } from "@/components/video-player"
import { FileUpload } from "@/components/file-upload"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const [currentVideo, setCurrentVideo] = useState<{
    sources: Array<{ src: string; type: string; label: string; res: number }>
    poster?: string
    title: string
    videoId: string
  }>({
    sources: [
      {
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        type: "video/mp4",
        label: "1080p",
        res: 1080,
      },
      {
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        type: "video/mp4",
        label: "720p",
        res: 720,
      },
    ],
    poster: "/placeholder.svg?height=720&width=1280",
    title: "Big Buck Bunny",
    videoId: "big-buck-bunny",
  })

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file)
    setCurrentVideo({
      sources: [
        {
          src: url,
          type: file.type,
          label: "Original",
          res: 1080,
        }, 
      ],
      title: file.name,
      videoId: `local-${Date.now()}`,
    })
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background transition-colors">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-foreground">Professional Video Player</h1>
            <ThemeToggle />
          </div>

          <div className="mb-6">
            <FileUpload onFileSelect={handleFileSelect} />
          </div>

          <VideoPlayer
            sources={currentVideo.sources}
            poster={currentVideo.poster}
            title={currentVideo.title}
            videoId={currentVideo.videoId}
            watermark="/placeholder.svg?height=40&width=120"
          />

          
        </div>
      </div>
    </ThemeProvider>
  )
}
