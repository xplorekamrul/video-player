// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Slider } from "@/components/ui/slider"
// import { X, ChevronRight, ChevronLeft, Settings, Zap, Palette } from "lucide-react"
// import { cn } from "@/lib/utils"

// interface VideoSource {
//   src: string
//   type: string
//   label: string
//   res: number
// }

// interface SettingsMenuProps {
//   sources: VideoSource[]
//   currentQuality: VideoSource
//   playbackRate: number
//   brightness: number
//   seekDuration: number
//   onQualityChange: (quality: VideoSource) => void
//   onPlaybackRateChange: (rate: number) => void
//   onBrightnessChange: (brightness: number) => void
//   onSeekDurationChange: (duration: number) => void
//   onClose: () => void
// }

// type MenuView = "main" | "quality" | "speed" | "display" | "controls"

// export function SettingsMenu({
//   sources,
//   currentQuality,
//   playbackRate,
//   brightness,
//   seekDuration,
//   onQualityChange,
//   onPlaybackRateChange,
//   onBrightnessChange,
//   onSeekDurationChange,
//   onClose,
// }: SettingsMenuProps) {
//   const [currentView, setCurrentView] = useState<MenuView>("main")

//   const speedOptions = [
//     { label: "0.25x", value: 0.25 },
//     { label: "0.5x", value: 0.5 },
//     { label: "0.75x", value: 0.75 },
//     { label: "Normal", value: 1 },
//     { label: "1.25x", value: 1.25 },
//     { label: "1.5x", value: 1.5 },
//     { label: "1.75x", value: 1.75 },
//     { label: "2x", value: 2 },
//   ]

//   const seekDurationOptions = [
//     { label: "5 seconds", value: 5 },
//     { label: "10 seconds", value: 10 },
//     { label: "15 seconds", value: 15 },
//     { label: "30 seconds", value: 30 },
//   ]

//   const qualityOptions = [
//     { label: "Auto", value: sources[0], description: "Adaptive quality" },
//     ...sources.map((source) => ({
//       label: source.label,
//       value: source,
//       description: `${source.res}p`,
//     })),
//   ]

//   const handleQualitySelect = (quality: VideoSource) => {
//     onQualityChange(quality)
//     onClose()
//   }

//   const handleSpeedSelect = (speed: number) => {
//     onPlaybackRateChange(speed)
//     onClose()
//   }

//   const renderMainMenu = () => (
//     <div className="space-y-1">
//       <div className="flex items-center justify-between p-4 border-b border-border">
//         <div className="flex items-center space-x-2">
//           <Settings className="h-4 w-4" />
//           <span className="font-medium">Settings</span>
//         </div>
//         <Button variant="ghost" size="sm" onClick={onClose}>
//           <X className="h-4 w-4" />
//         </Button>
//       </div>

//       <button
//         onClick={() => setCurrentView("quality")}
//         className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors"
//       >
//         <div className="flex items-center space-x-3">
//           <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
//             <span className="text-xs font-medium">HD</span>
//           </div>
//           <span>Quality</span>
//         </div>
//         <div className="flex items-center space-x-2">
//           <span className="text-sm text-muted-foreground">{currentQuality.label}</span>
//           <ChevronRight className="h-4 w-4" />
//         </div>
//       </button>

//       <button
//         onClick={() => setCurrentView("speed")}
//         className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors"
//       >
//         <div className="flex items-center space-x-3">
//           <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
//             <Zap className="h-4 w-4" />
//           </div>
//           <span>Playback Speed</span>
//         </div>
//         <div className="flex items-center space-x-2">
//           <span className="text-sm text-muted-foreground">
//             {speedOptions.find((s) => s.value === playbackRate)?.label || "Normal"}
//           </span>
//           <ChevronRight className="h-4 w-4" />
//         </div>
//       </button>

//       <button
//         onClick={() => setCurrentView("display")}
//         className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors"
//       >
//         <div className="flex items-center space-x-3">
//           <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
//             <Palette className="h-4 w-4" />
//           </div>
//           <span>Display</span>
//         </div>
//         <div className="flex items-center space-x-2">
//           <span className="text-sm text-muted-foreground">{brightness}%</span>
//           <ChevronRight className="h-4 w-4" />
//         </div>
//       </button>

//       <button
//         onClick={() => setCurrentView("controls")}
//         className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors"
//       >
//         <div className="flex items-center space-x-3">
//           <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
//             <Settings className="h-4 w-4" />
//           </div>
//           <span>Controls</span>
//         </div>
//         <div className="flex items-center space-x-2">
//           <span className="text-sm text-muted-foreground">{seekDuration}s</span>
//           <ChevronRight className="h-4 w-4" />
//         </div>
//       </button>
//     </div>
//   )

//   const renderQualityMenu = () => (
//     <div className="space-y-1">
//       <div className="flex items-center p-4 border-b border-border">
//         <Button variant="ghost" size="sm" onClick={() => setCurrentView("main")} className="mr-2">
//           <ChevronLeft className="h-4 w-4" />
//         </Button>
//         <span className="font-medium">Quality</span>
//       </div>

//       {qualityOptions.map((option, index) => (
//         <button
//           key={index}
//           onClick={() => handleQualitySelect(option.value)}
//           className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors"
//         >
//           <div className="flex flex-col items-start">
//             <span>{option.label}</span>
//             <span className="text-xs text-muted-foreground">{option.description}</span>
//           </div>
//           {currentQuality.label === option.value.label && <div className="w-2 h-2 bg-primary rounded-full" />}
//         </button>
//       ))}
//     </div>
//   )

//   const renderSpeedMenu = () => (
//     <div className="space-y-1">
//       <div className="flex items-center p-4 border-b border-border">
//         <Button variant="ghost" size="sm" onClick={() => setCurrentView("main")} className="mr-2">
//           <ChevronLeft className="h-4 w-4" />
//         </Button>
//         <span className="font-medium">Playback Speed</span>
//       </div>

//       {speedOptions.map((option) => (
//         <button
//           key={option.value}
//           onClick={() => handleSpeedSelect(option.value)}
//           className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors"
//         >
//           <span>{option.label}</span>
//           {playbackRate === option.value && <div className="w-2 h-2 bg-primary rounded-full" />}
//         </button>
//       ))}
//     </div>
//   )

//   const renderDisplayMenu = () => (
//     <div className="space-y-1">
//       <div className="flex items-center p-4 border-b border-border">
//         <Button variant="ghost" size="sm" onClick={() => setCurrentView("main")} className="mr-2">
//           <ChevronLeft className="h-4 w-4" />
//         </Button>
//         <span className="font-medium">Display Settings</span>
//       </div>

//       <div className="p-4 space-y-4">
//         <div className="space-y-2">
//           <div className="flex items-center justify-between">
//             <label className="text-sm font-medium">Brightness</label>
//             <span className="text-sm text-muted-foreground">{brightness}%</span>
//           </div>
//           <Slider
//             value={[brightness]}
//             onValueChange={(value) => onBrightnessChange(value[0])}
//             min={25}
//             max={200}
//             step={5}
//             className="w-full"
//           />
//           <div className="flex justify-between text-xs text-muted-foreground">
//             <span>25%</span>
//             <span>200%</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   )

//   const renderControlsMenu = () => (
//     <div className="space-y-1">
//       <div className="flex items-center p-4 border-b border-border">
//         <Button variant="ghost" size="sm" onClick={() => setCurrentView("main")} className="mr-2">
//           <ChevronLeft className="h-4 w-4" />
//         </Button>
//         <span className="font-medium">Control Settings</span>
//       </div>

//       <div className="p-4 space-y-4">
//         <div className="space-y-2">
//           <div className="flex items-center justify-between">
//             <label className="text-sm font-medium">Double-click Seek Duration</label>
//             <span className="text-sm text-muted-foreground">{seekDuration}s</span>
//           </div>
//           <div className="text-xs text-muted-foreground mb-2">
//             Duration for double-click seeking (left/right sides of video)
//           </div>
//           <div className="grid grid-cols-2 gap-2">
//             {seekDurationOptions.map((option) => (
//               <button
//                 key={option.value}
//                 onClick={() => onSeekDurationChange(option.value)}
//                 className={cn(
//                   "p-2 text-sm rounded border transition-colors",
//                   seekDuration === option.value
//                     ? "bg-primary text-primary-foreground border-primary"
//                     : "bg-background border-border hover:bg-accent",
//                 )}
//               >
//                 {option.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div className="space-y-2">
//           <div className="text-sm font-medium">Keyboard Shortcuts</div>
//           <div className="text-xs text-muted-foreground space-y-1">
//             <div>• Space/K: Play/Pause</div>
//             <div>• ←/→: Seek ±{seekDuration}s</div>
//             <div>• ↑/↓: Volume ±5%</div>
//             <div>• F: Fullscreen</div>
//             <div>• M: Mute/Unmute</div>
//             <div>• T: Theater Mode</div>
//             <div>• P: Picture-in-Picture</div>
//             <div>• 0-9: Seek to %</div>
//             <div>• Double-click: Seek ±{seekDuration}s</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )

//   return (
//     <div className="absolute bottom-16 right-4 w-80 bg-background/95 backdrop-blur-sm rounded-lg border shadow-xl z-50">
//       {currentView === "main" && renderMainMenu()}
//       {currentView === "quality" && renderQualityMenu()}
//       {currentView === "speed" && renderSpeedMenu()}
//       {currentView === "display" && renderDisplayMenu()}
//       {currentView === "controls" && renderControlsMenu()}
//     </div>
//   )
// }
