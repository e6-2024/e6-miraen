import { SplashType } from '../../types/6-1-1/types'

type WipeAudios = Record<SplashType, HTMLAudioElement>

class AudioManager {
  private static instance: AudioManager
  private currentAudio: HTMLAudioElement | null = null
  private currentAudioType: 'effect' | 'narration' | 'component' = 'effect'
  private currentComponentId: string | null = null
  private componentAudios: Map<string, HTMLAudioElement> = new Map()
  
  private narrationRef: HTMLAudioElement | null = null
  private wipingMapRef: WipeAudios | null = null
  private currentWipeKeyRef: SplashType | null = null
  private lastWipingAtRef: number = 0
  private unlockedRef: boolean = false
  private effectSoundsRef: HTMLAudioElement[] = []
  private isBrowser: boolean = false

  private constructor() {
    this.isBrowser = typeof window !== 'undefined'
    if (this.isBrowser) {
      this.initializeWipingAudios()
      this.setupAutoUnlock()
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  private initializeWipingAudios() {
    if (!this.isBrowser) return

    const mkAudio = (src: string, opts?: { loop?: boolean }) => {
      const a = new Audio(src)
      a.preload = 'auto'
      a.loop = !!opts?.loop
      a.volume = 0
      ;(a as any).playsInline = true
      return a
    }

    this.wipingMapRef = {
      splash01: mkAudio('/sounds/6-1-1/6-1-1-9-1.MP3', { loop: true }),
      splash02: mkAudio('/sounds/6-1-1/6-1-1-4_Glass.MP3', { loop: true }),
      splash03: mkAudio('/sounds/6-1-1/6-1-1-8_Scrubbing.MP3', { loop: true }),
      splash04: mkAudio('/sounds/6-1-1/6-1-1-9-1.MP3', { loop: true }),
    }
    this.narrationRef = mkAudio('', { loop: false })
  }

  private setupAutoUnlock() {
    if (!this.isBrowser) return

    const unlock = async () => {
      if (this.unlockedRef) return
      this.unlockedRef = true
      const wipes = this.wipingMapRef
      if (!wipes) return
      for (const key of Object.keys(wipes) as (keyof WipeAudios)[]) {
        try {
          const a = wipes[key]
          a.currentTime = 0
          a.volume = 0
          await a.play().catch(() => {})
        } catch {}
      }
      try {
        if (this.narrationRef) {
          this.narrationRef.src = ''
          this.narrationRef.load()
        }
      } catch {}
    }
    const onPointer = () => unlock()
    window.addEventListener('pointerdown', onPointer, { once: true })
  }

  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    this.currentComponentId = null
  }

  playEffect(audioPath: string, volume: number = 0.2): Promise<void> {
    if (!this.isBrowser) return Promise.resolve()

    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(audioPath)
        audio.volume = volume
        ;(audio as any).playsInline = true

        this.effectSoundsRef.push(audio)

        audio.addEventListener('ended', () => {
          const index = this.effectSoundsRef.indexOf(audio)
          if (index > -1) {
            this.effectSoundsRef.splice(index, 1)
          }
          resolve()
        })

        audio.addEventListener('error', () => {
          const index = this.effectSoundsRef.indexOf(audio)
          if (index > -1) {
            this.effectSoundsRef.splice(index, 1)
          }
          reject(new Error(`Effect audio failed to load: ${audioPath}`))
        })

        audio.play().catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  playNarration(audioPath: string, volume: number = 0.7): Promise<void> {
    if (!this.isBrowser) return Promise.resolve()

    return new Promise((resolve, reject) => {
      try {
        if (this.currentAudioType === 'narration') {
          this.stopCurrentAudio()
        }

        if (this.narrationRef) {
          this.narrationRef.pause()
          this.narrationRef.currentTime = 0
          this.narrationRef.src = ''
        }

        const audio = new Audio(audioPath)
        audio.volume = volume
        ;(audio as any).playsInline = true
        this.currentAudio = audio
        this.currentAudioType = 'narration'
        this.narrationRef = audio

        audio.addEventListener('ended', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null
          }
          resolve()
        })

        audio.addEventListener('error', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null
          }
          reject(new Error(`Narration audio failed to load: ${audioPath}`))
        })

        audio.play().catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  playComponentSound(
    audioPath: string,
    componentId: string,
    volume: number = 0.7,
    loop: boolean = false,
  ): Promise<HTMLAudioElement> {
    if (!this.isBrowser) return Promise.reject(new Error('Not in browser'))

    return new Promise((resolve, reject) => {
      try {
        if (this.componentAudios.has(componentId)) {
          const existingAudio = this.componentAudios.get(componentId)
          if (existingAudio) {
            existingAudio.pause()
            existingAudio.currentTime = 0
            this.componentAudios.delete(componentId)
          }
        }

        const audio = new Audio(audioPath)
        audio.volume = volume
        audio.loop = loop
        ;(audio as any).playsInline = true

        this.componentAudios.set(componentId, audio)

        if (loop) {
          this.currentAudio = audio
          this.currentAudioType = 'component'
          this.currentComponentId = componentId
        }

        audio.addEventListener('ended', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null
            this.currentComponentId = null
          }
          this.componentAudios.delete(componentId)
        })

        audio.addEventListener('error', () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null
            this.currentComponentId = null
          }
          this.componentAudios.delete(componentId)
          reject(new Error(`Component audio failed to load: ${audioPath}`))
        })

        audio
          .play()
          .then(() => resolve(audio))
          .catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  stopComponentSound(componentId: string) {
    if (this.componentAudios.has(componentId)) {
      const audio = this.componentAudios.get(componentId)
      if (audio) {
        audio.pause()
        audio.currentTime = 0
        this.componentAudios.delete(componentId)

        if (this.currentAudio === audio) {
          this.currentAudio = null
          this.currentComponentId = null
        }
      }
    }
  }

  playGeneralButton(audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3'): Promise<void> {
    return this.playEffect(audioPath, 0.5)
  }

  playSound(path: string, volume = 0.7) {
    if (!this.isBrowser) return

    try {
      const a = new Audio(path)
      a.volume = volume
      ;(a as any).playsInline = true
      
      this.effectSoundsRef.push(a)
      
      a.addEventListener('ended', () => {
        const index = this.effectSoundsRef.indexOf(a)
        if (index > -1) {
          this.effectSoundsRef.splice(index, 1)
        }
      })
      
      a.play().catch(() => {})
    } catch {}
  }

  private liquidMessageNarrations: Record<SplashType, string> = {
    splash01: '/sounds/6-1-1/narration/6-1-1-J.MP3',
    splash02: '/sounds/6-1-1/narration/6-1-1-J.MP3',
    splash03: '/sounds/6-1-1/narration/6-1-1-J.MP3',
    splash04: '/sounds/6-1-1/narration/6-1-1-J.MP3',
  }

  private clickMessageNarrations: Record<SplashType, string> = {
    splash01: '/sounds/6-1-1/narration/6-1-1-A-3.MP3',
    splash02: '/sounds/6-1-1/narration/6-1-1-C-3.MP3',
    splash03: '/sounds/6-1-1/narration/6-1-1-E-3.MP3',
    splash04: '/sounds/6-1-1/narration/6-1-1-G-3.MP3',
  }

  playLiquidMessageNarration(splashType: SplashType) {
    if (this.liquidMessageNarrations[splashType]) {
      setTimeout(() => {
        this.playNarration(this.liquidMessageNarrations[splashType])
      }, 800)
    }
  }

  playClickMessageNarration(splashType: SplashType) {
    if (this.clickMessageNarrations[splashType]) {
      setTimeout(() => {
        this.playNarration(this.clickMessageNarrations[splashType])
      }, 800)
    }
  }

  private ensureWipeTrack(key: SplashType) {
    const wipes = this.wipingMapRef
    if (!wipes) return null
    const a = wipes[key]
    if (a.paused) {
      a.currentTime = 0
      a.volume = 0
      a.play().catch(() => {})
    }
    return a
  }

  playWipingSound(currentMission: SplashType, velocity: number) {
    if (!this.isBrowser) return

    const now = Date.now()
    this.lastWipingAtRef = now

    const a = this.ensureWipeTrack(currentMission)
    if (!a) return

    this.currentWipeKeyRef = currentMission

    const targetVol = Math.min(0.75, 0.25 + velocity * 0.02)
    const targetRate = Math.min(1.6, 0.9 + velocity * 0.03)

    a.playbackRate = targetRate
    a.volume += (targetVol - a.volume) * 0.35
  }

  fadeWipingSound() {
    const key = this.currentWipeKeyRef
    if (!key || !this.wipingMapRef) return
    const a = this.wipingMapRef[key]
    if (!a) return
    a.volume += (0 - a.volume) * 0.2
    if (a.volume < 0.01) a.volume = 0
  }

  stopWipingAudio() {
    if (!this.wipingMapRef) return
    for (const k of Object.keys(this.wipingMapRef) as (keyof WipeAudios)[]) {
      const a = this.wipingMapRef[k]
      a.pause()
      a.currentTime = 0
      a.volume = 0
    }
    this.currentWipeKeyRef = null
  }

  stopAll() {
    if (!this.isBrowser) return

    this.stopCurrentAudio()

    this.componentAudios.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
      audio.src = ''
    })
    this.componentAudios.clear()

    this.effectSoundsRef.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
      audio.src = ''
    })
    this.effectSoundsRef = []

    this.stopWipingAudio()

    if (this.narrationRef) {
      this.narrationRef.pause()
      this.narrationRef.currentTime = 0
      this.narrationRef.src = ''
    }

    if (typeof document !== 'undefined') {
      document.querySelectorAll('audio').forEach((el) => {
        if (!el.paused) {
          try {
            el.pause()
            el.currentTime = 0
            el.src = ''
          } catch {}
        }
      })
    }
  }
}

export default AudioManager