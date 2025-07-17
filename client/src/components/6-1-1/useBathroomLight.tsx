import { useState } from 'react'
import { SplashType } from '../../types/6-1-1'

export const useBathroomLight = () => {
  const [isBathroomLightOn, setIsBathroomLightOn] = useState(false)

  const turnOnBathroomLight = (missionId: SplashType) => {
    // 변기용 세제(splash02) 또는 표백제(splash03) 미션일 때만 불 켜기
    if (missionId === 'splash02' || missionId === 'splash03') {
      setIsBathroomLightOn(true)
    }
  }

  const turnOffBathroomLight = () => {
    setIsBathroomLightOn(false)
  }

  return {
    isBathroomLightOn,
    turnOnBathroomLight,
    turnOffBathroomLight
  }
}