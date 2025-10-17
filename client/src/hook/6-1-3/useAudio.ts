import { useCallback, useRef } from 'react'
import { ViewType, getAudioPath } from '@/utils/6-1-3/utils'

type NarrationType = Extract<ViewType, 'root' | 'stem' | 'leaf' | 'water'>

export const usePlantAudio = () => {
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null)
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null)

  const playSound = useCallback((audioPath: string, volume: number = 0.7) => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = volume
      audio.play().catch((error) => {
        console.log('오디오 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('오디오 생성 실패:', error)
    }
  }, [])

  const playNarration = useCallback((type: NarrationType) => {
    const audioPath = getAudioPath(type)
    if (!audioPath) return

    try {
      if (narrationAudioRef.current) {
        narrationAudioRef.current.pause()
        narrationAudioRef.current.currentTime = 0
      }
      const audio = new Audio(audioPath)
      audio.volume = 0.8
      narrationAudioRef.current = audio
      audio.play().catch((error) => {
        console.log('나레이션 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('나레이션 생성 실패:', error)
    }
  }, [])

  const stopNarration = useCallback(() => {
    if (!narrationAudioRef.current) return
    try {
      narrationAudioRef.current.pause()
      narrationAudioRef.current.currentTime = 0
    } finally {
      narrationAudioRef.current = null
    }
  }, [])

  const playBackgroundSound = useCallback((audioPath: string = '/sounds/6-1-3/6-1-3-2_ambient-bubbling-liquid-61254.mp3') => {
    try {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause()
        backgroundAudioRef.current.currentTime = 0
      }
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.loop = true
      backgroundAudioRef.current = audio
      audio.play().catch((error) => {
        console.log('배경음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('배경음 생성 실패:', error)
    }
  }, [])

  const stopBackgroundSound = useCallback(() => {
    if (!backgroundAudioRef.current) return
    try {
      backgroundAudioRef.current.pause()
      backgroundAudioRef.current.currentTime = 0
    } finally {
      backgroundAudioRef.current = null
    }
  }, [])

  const stopAll = useCallback(() => {
    stopBackgroundSound()
    stopNarration()
  }, [stopBackgroundSound, stopNarration])

  const cleanup = useCallback(() => {
    stopAll()
  }, [stopAll])

  return {
    playSound,
    playNarration,
    stopNarration,
    playBackgroundSound,
    stopBackgroundSound,
    stopAll,
    cleanup,
  }
}
