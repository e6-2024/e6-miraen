import { useState, useRef, useCallback } from 'react'

export function useExperimentState() {
  const [selectedBeaker, setSelectedBeaker] = useState<'left' | 'right' | null>(null)
  const [leftSugarDropping, setLeftSugarDropping] = useState(false)
  const [rightSugarDropping, setRightSugarDropping] = useState(false)
  const [discRotating, setDiscRotating] = useState(false)

  const [leftSpoonCount, setLeftSpoonCount] = useState(0)
  const [rightSpoonCount, setRightSpoonCount] = useState(0)
  const [leftComplete, setLeftComplete] = useState(false)
  const [rightComplete, setRightComplete] = useState(false)
  const [showGlassStick, setShowGlassStick] = useState(false)
  const [glassStickAnimating, setGlassStickAnimating] = useState(false)

  const selectingRef = useRef(false)
  const lastSelectedSideRef = useRef<'left' | 'right' | null>(null)
  const animationFinishedRef = useRef(false)

  const startSugarExperiment = useCallback(
    (side: 'left' | 'right') => {
      if (side === 'left' && leftSpoonCount > 0) return
      if (side === 'right' && rightSpoonCount >= 5) return

      setTimeout(() => {
        ;(window as any).startDiscRotation?.()
      }, 100)

      window.setTimeout(() => {
        if (side === 'left' && leftSpoonCount === 0) {
          setLeftSugarDropping(true)
          setLeftSpoonCount(1)
        } else if (side === 'right' && rightSpoonCount < 5) {
          setRightSugarDropping(true)
          setRightSpoonCount((prev) => prev + 1)
        }
      }, 1000)
    },
    [leftSpoonCount, rightSpoonCount],
  )

  const handleSpoonComplete = useCallback(
    (side: 'left' | 'right') => {
      if (side === 'left') {
        setLeftSugarDropping(false)
        setLeftComplete(true)
        setTimeout(() => {
          setShowGlassStick(true)
          setGlassStickAnimating(true)
        }, 1000)
      } else {
        setRightSugarDropping(false)
        if (rightSpoonCount >= 5) {
          setRightComplete(true)
          setTimeout(() => {
            setShowGlassStick(true)
            setGlassStickAnimating(true)
          }, 1000)
        } else {
          startSugarExperiment('right')
        }
      }
    },
    [leftSpoonCount, rightSpoonCount, startSugarExperiment],
  )

  const reset = useCallback(() => {
    setLeftSpoonCount(0)
    setRightSpoonCount(0)
    setLeftComplete(false)
    setRightComplete(false)
    setLeftSugarDropping(false)
    setRightSugarDropping(false)
    setShowGlassStick(false)
    setGlassStickAnimating(false)
    setSelectedBeaker(null)
    selectingRef.current = false
    lastSelectedSideRef.current = null
    animationFinishedRef.current = false
  }, [])

  return {
    selectedBeaker,
    setSelectedBeaker,
    leftSugarDropping,
    setLeftSugarDropping,
    rightSugarDropping,
    setRightSugarDropping,
    discRotating,
    setDiscRotating,
    leftSpoonCount,
    rightSpoonCount,
    leftComplete,
    rightComplete,
    showGlassStick,
    glassStickAnimating,
    setGlassStickAnimating,
    selectingRef,
    lastSelectedSideRef,
    animationFinishedRef,
    startSugarExperiment,
    handleSpoonComplete,
    reset,
  }
}
