import { useState, useEffect } from 'react'

interface MousePosition {
  x: number
  y: number
}

interface UseMouseInteractionOptions {
  /** 마우스 추적을 활성화할지 여부 */
  enabled?: boolean
  /** 마우스 움직임에 대한 감도 */
  sensitivity?: { x: number; y: number }
  /** 마우스가 화면 가장자리에 있을 때 중앙으로 돌아가는 시간 (ms) */
  edgeReturnDelay?: number
  /** 마우스가 화면을 벗어났을 때 중앙으로 돌아가는 시간 (ms) */
  leaveReturnDelay?: number
  /** 부드러운 움직임을 위한 보간 속도 (0.01 = 매우 느림, 0.1 = 빠름) */
  lerpSpeed?: number
  /** 가장자리 감지를 위한 마진 (0-1) */
  edgeMargin?: number
}

interface UseMouseInteractionReturn {
  /** 현재 마우스 위치 (0-1 범위) */
  mousePosition: MousePosition
  /** 부드럽게 보간된 마우스 위치 */
  smoothMousePosition: MousePosition
  /** 계산된 회전값 { rotationX, rotationY } */
  rotation: { rotationX: number; rotationY: number }
}

export const useMouseInteraction = (
  options: UseMouseInteractionOptions = {}
): UseMouseInteractionReturn => {
  const {
    enabled = true,
    sensitivity = { x: 0.3, y: 0.1 },
    edgeReturnDelay = 400,
    leaveReturnDelay = 300,
    lerpSpeed = 0.05,
    edgeMargin = 0.05,
  } = options

  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0.5, y: 0.5 })
  const [targetMousePosition, setTargetMousePosition] = useState<MousePosition>({ x: 0.5, y: 0.5 })
  const [smoothMousePosition, setSmoothMousePosition] = useState<MousePosition>({ x: 0.5, y: 0.5 })

  // 부드러운 마우스 위치 보간
  useEffect(() => {
    if (!enabled) return

    let animationFrame: number

    const animate = () => {
      setSmoothMousePosition(prev => {
        const dx = targetMousePosition.x - prev.x
        const dy = targetMousePosition.y - prev.y
        
        const newX = prev.x + dx * lerpSpeed
        const newY = prev.y + dy * lerpSpeed
        
        // 차이가 매우 작으면 목표 위치로 설정
        if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
          return targetMousePosition
        }
        
        return { x: newX, y: newY }
      })
      
      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [targetMousePosition, enabled, lerpSpeed])

  // 마우스 움직임 감지
  useEffect(() => {
    if (!enabled) return

    let mouseLeaveTimeout: NodeJS.Timeout | null = null

    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth
      const y = event.clientY / window.innerHeight
      
      setMousePosition({ x, y })
      setTargetMousePosition({ x, y })
      
      const isOutOfBounds = x < edgeMargin || x > (1 - edgeMargin) || y < edgeMargin || y > (1 - edgeMargin)
      
      if (isOutOfBounds) {
        if (!mouseLeaveTimeout) {
          mouseLeaveTimeout = setTimeout(() => {
            setTargetMousePosition({ x: 0.5, y: 0.5 })
            mouseLeaveTimeout = null
          }, edgeReturnDelay)
        }
      } else {
        if (mouseLeaveTimeout) {
          clearTimeout(mouseLeaveTimeout)
          mouseLeaveTimeout = null
        }
      }
    }

    const handleMouseLeave = () => {
      // 완전히 화면을 벗어나면 중앙으로 돌아가기
      if (mouseLeaveTimeout) {
        clearTimeout(mouseLeaveTimeout)
      }
      mouseLeaveTimeout = setTimeout(() => {
        setTargetMousePosition({ x: 0.5, y: 0.5 })
        mouseLeaveTimeout = null
      }, leaveReturnDelay)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (mouseLeaveTimeout) {
        clearTimeout(mouseLeaveTimeout)
      }
    }
  }, [enabled, edgeMargin, edgeReturnDelay, leaveReturnDelay])

  // 회전값 계산
  const rotation = {
    rotationY: (smoothMousePosition.x - 0.5) * sensitivity.x,
    rotationX: (smoothMousePosition.y - 0.5) * sensitivity.y,
  }

  return {
    mousePosition,
    smoothMousePosition,
    rotation,
  }
}