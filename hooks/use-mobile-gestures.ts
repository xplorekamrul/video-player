"use client"

import { useEffect, type RefObject } from "react"

interface GestureHandlers {
  onTap: () => void
  onSwipeLeft: () => void
  onSwipeRight: () => void
  onSwipeUp: () => void
  onSwipeDown: () => void
}

export function useMobileGestures(containerRef: RefObject<HTMLElement>, handlers: GestureHandlers) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let startX = 0
    let startY = 0
    let startTime = 0
    let isTouch = false

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return

      const touch = e.touches[0]
      startX = touch.clientX
      startY = touch.clientY
      startTime = Date.now()
      isTouch = true
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTouch || e.changedTouches.length !== 1) return

      const touch = e.changedTouches[0]
      const endX = touch.clientX
      const endY = touch.clientY
      const endTime = Date.now()

      const deltaX = endX - startX
      const deltaY = endY - startY
      const deltaTime = endTime - startTime

      const minSwipeDistance = 50
      const maxSwipeTime = 300
      const maxTapDistance = 10
      const maxTapTime = 200

      // Check for tap
      if (Math.abs(deltaX) < maxTapDistance && Math.abs(deltaY) < maxTapDistance && deltaTime < maxTapTime) {
        handlers.onTap()
        isTouch = false
        return
      }

      // Check for swipes
      if (deltaTime < maxSwipeTime) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            handlers.onSwipeRight()
          } else {
            handlers.onSwipeLeft()
          }
        } else if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            handlers.onSwipeDown()
          } else {
            handlers.onSwipeUp()
          }
        }
      }

      isTouch = false
    }

    const handleTouchCancel = () => {
      isTouch = false
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })
    container.addEventListener("touchcancel", handleTouchCancel, { passive: true })

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchend", handleTouchEnd)
      container.removeEventListener("touchcancel", handleTouchCancel)
    }
  }, [containerRef, handlers])
}
