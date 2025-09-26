import { useState, useRef } from 'react'
import { SpoonAnimationState } from '@/types/5-1-3/types'

export const useSpoonAnimation = () => {
  const [rotation, setRotation] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const triggerAnimation = () => {
    if (animationRef.current || isAnimating) {
      return
    }

    console.log('숟가락 애니메이션 시작')
    setIsAnimating(true)
    setRotation(0)

    const startTime = Date.now()
    const duration = 1000

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const currentRotation = (-progress * Math.PI) / 2

      setRotation(currentRotation)

      if (progress >= 1) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        animationRef.current = setTimeout(() => {
          const returnStartTime = Date.now()
          const returnDuration = 500

          intervalRef.current = setInterval(() => {
            const returnElapsed = Date.now() - returnStartTime
            const returnProgress = Math.min(returnElapsed / returnDuration, 1)
            const returnRotation = (-Math.PI / 2) * (1 - returnProgress)

            setRotation(returnRotation)

            if (returnProgress >= 1) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
              }
              setRotation(0)
              setIsAnimating(false)
              animationRef.current = null
              console.log('숟가락 애니메이션 완료')
            }
          }, 16)
        })
      }
    }, 16)
  }

  const cleanup = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current)
      animationRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRotation(0)
    setIsAnimating(false)
  }

  return {
    rotation,
    isAnimating,
    triggerAnimation,
    cleanup,
  }
}