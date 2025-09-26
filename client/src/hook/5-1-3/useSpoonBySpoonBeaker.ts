import { useState, useRef, useCallback } from 'react'
import { BeakerState } from '@/types/5-1-3/types'

export const useSpoonBySpoonBeaker = (beakerId: string, totalSpoons: number) => {
  const [currentSpoon, setCurrentSpoon] = useState(0)
  const [totalDissolved, setTotalDissolved] = useState(0)
  const [isDropping, setIsDropping] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const startExperiment = useCallback(() => {
    console.log(`${beakerId}: 실험 시작 - 총 ${totalSpoons}스푼`)
    setCurrentSpoon(1)
    setTotalDissolved(0)
    setIsCompleted(false)
    setIsDropping(true)
  }, [beakerId, totalSpoons])

  const handleSpoonDissolved = useCallback(() => {
    console.log(`${beakerId}: ${currentSpoon}번째 스푼 용해 완료`)
    setTotalDissolved((prev) => prev + 1)
    setIsDropping(false)

    if (currentSpoon < totalSpoons) {
      console.log(`${beakerId}: 다음 스푼 준비 중...`)
      timeoutRef.current = setTimeout(() => {
        setCurrentSpoon((prev) => prev + 1)
        setIsDropping(true)
        console.log(`${beakerId}: ${currentSpoon + 1}번째 스푼 투입`)
      }, 0)
    } else {
      console.log(`${beakerId}: 모든 스푼 완료!`)
      setIsCompleted(true)
    }
  }, [beakerId, currentSpoon, totalSpoons])

  const stopExperiment = useCallback(() => {
    console.log(`${beakerId}: 실험 중지`)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsDropping(false)
    setCurrentSpoon(0)
  }, [beakerId])

  const reset = useCallback(() => {
    console.log(`${beakerId}: 초기화`)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setCurrentSpoon(0)
    setTotalDissolved(0)
    setIsDropping(false)
    setIsCompleted(false)
  }, [beakerId])

  const isExperimentRunning = currentSpoon > 0 && !isCompleted

  return {
    currentSpoon,
    totalDissolved,
    isDropping,
    isCompleted,
    isExperimentRunning,
    startExperiment,
    stopExperiment,
    reset,
    handleSpoonDissolved,
    progress: `${currentSpoon}/${totalSpoons}`,
  }
}