class AudioManager {
  private currentAudio: HTMLAudioElement | null = null
  private volume: number = 0.5

  async playAudio(audioPath: string, volume: number = this.volume): Promise<void> {
    try {
      this.stopCurrentAudio()

      const audio = new Audio(audioPath)
      audio.volume = Math.max(0, Math.min(1, volume))
      this.currentAudio = audio

      const cleanup = () => {
        if (this.currentAudio === audio) this.currentAudio = null
      }
      audio.addEventListener('ended', cleanup, { once: true })
      audio.addEventListener('error', cleanup, { once: true })

      await audio.play().catch((e) => {
        console.warn('audio.play() rejected:', e)
      })
    } catch (error) {
      console.log(`오디오 재생 실패 (${audioPath}):`, error)
      this.currentAudio = null
    }
  }

  stopCurrentAudio(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause()
        this.currentAudio.currentTime = 0
        this.currentAudio.src = ''
        this.currentAudio.load()
      } catch {}
      this.currentAudio = null
    }
  }

  setDefaultVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused
  }
}

const globalAny = globalThis as any
if (!globalAny.__audioManager) globalAny.__audioManager = new AudioManager()
if (!globalAny.__audioManager2) globalAny.__audioManager2 = new AudioManager()

export const audioManager: AudioManager = globalAny.__audioManager
export const audioManager2: AudioManager = globalAny.__audioManager2

export const playSound = (audioPath: string, volume?: number) =>
  audioManager.playAudio(audioPath, volume)

export const playNarration = (audioPath: string, volume?: number) =>
  audioManager2.playAudio(audioPath, volume)

export const stopNarration = () => audioManager2.stopCurrentAudio()
export const stopSound = () => audioManager.stopCurrentAudio()
