// hooks/useAudioManager.ts
import { useRef, useCallback, useEffect } from 'react'

// 전역 오디오 관리자 클래스
class GlobalAudioManager {
  private static instance: GlobalAudioManager
  private currentAudio: HTMLAudioElement | null = null
  private currentController: AbortController | null = null
  private listeners: Set<(isPlaying: boolean, audioId?: string) => void> = new Set()

  public static getInstance(): GlobalAudioManager {
    if (!GlobalAudioManager.instance) {
      GlobalAudioManager.instance = new GlobalAudioManager()
    }
    return GlobalAudioManager.instance
  }

  // 리스너 등록
  public addListener(callback: (isPlaying: boolean, audioId?: string) => void) {
    this.listeners.add(callback)
  }

  // 리스너 제거
  public removeListener(callback: (isPlaying: boolean, audioId?: string) => void) {
    this.listeners.delete(callback)
  }

  // 모든 리스너에게 상태 알림
  private notifyListeners(isPlaying: boolean, audioId?: string) {
    this.listeners.forEach(callback => callback(isPlaying, audioId))
  }

  // 현재 재생 중인 오디오 중지
  public stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    
    if (this.currentController) {
      this.currentController.abort()
      this.currentController = null
    }
    
    this.notifyListeners(false)
  }

  // 새 오디오 재생
  public async playAudio(audioPath: string, audioId: string, volume: number = 0.7): Promise<void> {
    // 기존 오디오 중지
    this.stopCurrentAudio()

    try {
      const controller = new AbortController()
      this.currentController = controller

      const audio = new Audio(audioPath)
      audio.volume = volume
      this.currentAudio = audio

      // 재생 시작 알림
      this.notifyListeners(true, audioId)

      // 오디오 종료 이벤트 리스너
      const handleEnded = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null
          this.currentController = null
          this.notifyListeners(false, audioId)
        }
      }

      audio.addEventListener('ended', handleEnded)

      // 중단 신호 처리
      controller.signal.addEventListener('abort', () => {
        audio.removeEventListener('ended', handleEnded)
        audio.pause()
        if (this.currentAudio === audio) {
          this.currentAudio = null
          this.notifyListeners(false, audioId)
        }
      })

      await audio.play()
    } catch (error) {
      console.log('오디오 재생 실패:', error)
      this.notifyListeners(false, audioId)
      throw error
    }
  }

  // 현재 재생 상태 확인
  public isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused
  }

  // 특정 오디오가 재생 중인지 확인
  public isPlayingAudio(audioId: string): boolean {
    // 실제 구현에서는 audioId를 추적하는 로직이 필요할 수 있습니다
    return this.isPlaying()
  }
}

// React Hook
export function useAudioManager(audioId: string) {
  const managerRef = useRef<GlobalAudioManager>()
  const isPlayingRef = useRef(false)
  const currentAudioIdRef = useRef<string | null>(null)
  
  // 콜백을 useRef로 저장하여 리스너 등록/해제 시 참조 일관성 유지
  const listenerRef = useRef<(isPlaying: boolean, playingAudioId?: string) => void>()

  // 매니저 초기화
  if (!managerRef.current) {
    managerRef.current = GlobalAudioManager.getInstance()
  }

  // 상태 업데이트 콜백
  const updatePlayingState = useCallback((isPlaying: boolean, playingAudioId?: string) => {
    isPlayingRef.current = isPlaying && playingAudioId === audioId
    currentAudioIdRef.current = isPlaying ? (playingAudioId || null) : null
  }, [audioId])

  // 리스너 등록/해제
  useEffect(() => {
    const manager = managerRef.current!
    listenerRef.current = updatePlayingState
    
    manager.addListener(listenerRef.current)
    
    return () => {
      if (listenerRef.current) {
        manager.removeListener(listenerRef.current)
      }
    }
  }, [updatePlayingState])

  // 오디오 재생 함수
  const playAudio = useCallback(async (audioPath: string, volume?: number) => {
    try {
      await managerRef.current!.playAudio(audioPath, audioId, volume)
    } catch (error) {
      console.error('오디오 재생 중 오류:', error)
    }
  }, [audioId])

  // 현재 재생 중지
  const stopAudio = useCallback(() => {
    managerRef.current!.stopCurrentAudio()
  }, [])

  // 현재 컴포넌트의 오디오가 재생 중인지
  const isCurrentlyPlaying = useCallback(() => {
    return isPlayingRef.current
  }, [])

  // 다른 오디오가 재생 중인지
  const isOtherAudioPlaying = useCallback(() => {
    const manager = managerRef.current!
    return manager.isPlaying() && !isPlayingRef.current
  }, [])

  // 전역적으로 오디오가 재생 중인지
  const isAnyAudioPlaying = useCallback(() => {
    return managerRef.current!.isPlaying()
  }, [])

  return {
    playAudio,
    stopAudio,
    isCurrentlyPlaying,
    isOtherAudioPlaying,
    isAnyAudioPlaying
  }
}