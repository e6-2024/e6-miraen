// hooks/5-1-3/useExperimentState.ts
import { useState, useRef, useCallback } from 'react'

export function useExperimentState() {
  const [selectedBeaker, setSelectedBeaker] = useState<'left' | 'right' | null>(null)
  const [leftSugarDropping, setLeftSugarDropping] = useState(false)
  const [rightSugarDropping, setRightSugarDropping] = useState(false)
  const [discRotating, setDiscRotating] = useState(false)
  
  const selectingRef = useRef(false)
  const lastSelectedSideRef = useRef<'left' | 'right' | null>(null)
  const animationFinishedRef = useRef(false)

  const startSugarExperiment = useCallback((side: 'left' | 'right') => {
    ;(window as any).startDiscRotation?.()
    window.setTimeout(() => {
      if (side === 'left') setLeftSugarDropping(true)
      else setRightSugarDropping(true)
    }, 1000)
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
    selectingRef,
    lastSelectedSideRef,
    animationFinishedRef,
    startSugarExperiment
  }
}