"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-white/20 border-t-white",
          sizeClasses[size],
          className,
        )}
        role="status"
        aria-label="Loading"
      />
      <span className="text-white text-sm">Loading...</span>
    </div>
  )
}
