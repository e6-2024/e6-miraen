import { useState, useCallback } from 'react'
import { TomatoState } from '@/types/5-1-3/types'

export const useTomatoDrop = (beakerId: string) => {
  const [isDropped, setIsDropped] = useState(false)
  const [isFloating, setIsFloating] = useState(false)

  const dropTomato = useCallback(() => {
    console.log(`${beakerId}: 토마토 드롭!`)
    setIsDropped(true)
    setIsFloating(false)
  }, [beakerId])

  const handleTomatoInWater = useCallback(() => {
    console.log(`${beakerId}: 토마토가 물에 들어감`)
    setIsFloating(true)
  }, [beakerId])

  const reset = useCallback(() => {
    console.log(`${beakerId}: 토마토 리셋`)
    setIsDropped(false)
    setIsFloating(false)
  }, [beakerId])

  return {
    isDropped,
    isFloating,
    dropTomato,
    handleTomatoInWater,
    reset,
  }
}