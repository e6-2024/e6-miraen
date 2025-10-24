import { useMemo } from 'react'
import AudioManager from './AudioManager'

export const useAudioManager = () => {
  const audioManager = useMemo(() => AudioManager.getInstance(), [])

  return {
    playSound: (path: string, volume?: number) => audioManager.playSound(path, volume),
    playNarration: (path: string) => audioManager.playNarration(path, 0.7),
    playLiquidMessageNarration: (splashType: any) => audioManager.playLiquidMessageNarration(splashType),
    playClickMessageNarration: (splashType: any) => audioManager.playClickMessageNarration(splashType),
    playWipingSound: (currentMission: any, velocity: number) => audioManager.playWipingSound(currentMission, velocity),
    fadeWipingSound: () => audioManager.fadeWipingSound(),
    stopAllAudio: () => audioManager.stopAll(),
    stopWipingAudio: () => audioManager.stopWipingAudio(),
  }
}