class AudioManager {
  private static instance: AudioManager
  private narrationAudio: HTMLAudioElement | null = null
  private effectAudio: HTMLAudioElement | null = null
  private componentAudios: Map<string, HTMLAudioElement> = new Map()
  private defaultVolume: number = 0.7

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  async playNarration(audioPath: string, volume: number = 1.0): Promise<void> {
    try {
      if (this.narrationAudio && !this.narrationAudio.paused) {
        this.narrationAudio.pause()
        this.narrationAudio.currentTime = 0
        this.narrationAudio = null
      }
      
      const audio = new Audio(audioPath)
      audio.volume = Math.max(0, Math.min(1, volume))
      this.narrationAudio = audio

      const cleanup = () => {
        if (this.narrationAudio === audio) {
          this.narrationAudio = null
        }
      }

      audio.addEventListener('ended', cleanup, { once: true })
      audio.addEventListener('error', cleanup, { once: true })

      await audio.play().catch((e) => {
        console.warn('Narration play rejected:', e)
        cleanup()
      })
    } catch (error) {
      console.log(`나레이션 재생 실패 (${audioPath}):`, error)
      this.narrationAudio = null
    }
  }

  async playEffect(audioPath: string, volume: number = 0.7): Promise<void> {
    try {
      const audio = new Audio(audioPath)
      audio.volume = Math.max(0, Math.min(1, volume))
      
      audio.addEventListener('ended', () => {
        audio.remove()
      }, { once: true })

      await audio.play().catch((e) => {
        console.warn('Effect play rejected:', e)
      })
    } catch (error) {
      console.log(`효과음 재생 실패 (${audioPath}):`, error)
    }
  }

  async playComponentSound(
    audioPath: string, 
    componentId: string, 
    volume: number = 0.7, 
    loop: boolean = false
  ): Promise<HTMLAudioElement> {
    try {
      this.stopComponentSound(componentId)
      
      const audio = new Audio(audioPath)
      audio.volume = Math.max(0, Math.min(1, volume))
      audio.loop = loop
      
      this.componentAudios.set(componentId, audio)
      
      const cleanup = () => {
        if (this.componentAudios.get(componentId) === audio) {
          this.componentAudios.delete(componentId)
        }
      }

      audio.addEventListener('ended', cleanup, { once: true })
      audio.addEventListener('error', cleanup, { once: true })

      await audio.play().catch((e) => {
        console.warn('Component sound play rejected:', e)
        cleanup()
        throw e
      })

      return audio
    } catch (error) {
      console.log(`컴포넌트 사운드 재생 실패 (${audioPath}):`, error)
      throw error
    }
  }

  stopNarration(): void {
    if (this.narrationAudio) {
      try {
        this.narrationAudio.pause()
        this.narrationAudio.currentTime = 0
      } catch {}
      this.narrationAudio = null
    }
  }

  stopComponentSound(componentId: string): void {
    const audio = this.componentAudios.get(componentId)
    if (audio) {
      try {
        audio.pause()
        audio.currentTime = 0
      } catch {}
      this.componentAudios.delete(componentId)
    }
  }

  stopAll(): void {
    this.stopNarration()
    this.componentAudios.forEach((audio, id) => {
      this.stopComponentSound(id)
    })
  }

  playGeneralButton(audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3'): Promise<void> {
    return this.playEffect(audioPath, 0.5)
  }

  isNarrationPlaying(): boolean {
    return this.narrationAudio !== null && !this.narrationAudio.paused
  }

  setDefaultVolume(volume: number): void {
    this.defaultVolume = Math.max(0, Math.min(1, volume))
  }
}

const globalAny = globalThis as any
if (!globalAny.__audioManager623) {
  globalAny.__audioManager623 = AudioManager.getInstance()
}

export const audioManager: AudioManager = globalAny.__audioManager623
export const playNarration = (path: string, volume?: number) => audioManager.playNarration(path, volume)
export const playEffect = (path: string, volume?: number) => audioManager.playEffect(path, volume)
export const stopNarration = () => audioManager.stopNarration()
export const stopAll = () => audioManager.stopAll()

export default AudioManager