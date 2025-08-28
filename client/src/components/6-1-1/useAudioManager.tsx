import { useEffect, useRef } from 'react'
import { SplashType } from '../../types/6-1-1/types'

type WipeAudios = Record<SplashType, HTMLAudioElement>

export const useAudioManager = () => {
  const narrationRef = useRef<HTMLAudioElement | null>(null)

  const wipingMapRef = useRef<WipeAudios | null>(null)
  const currentWipeKeyRef = useRef<SplashType | null>(null)
  const lastWipingAtRef = useRef(0)
  const unlockedRef = useRef(false)

  const mkAudio = (src: string, opts?: { loop?: boolean }) => {
    const a = new Audio(src)
    a.preload = 'auto'
    a.loop = !!opts?.loop
    a.volume = 0
    ;(a as any).playsInline = true
    return a
  }

  useEffect(() => {
    wipingMapRef.current = {
      splash01: mkAudio('/sounds/6-1-1/6-1-1-9-1.MP3', { loop: true }),
      splash02: mkAudio('/sounds/6-1-1/6-1-1-4_Glass.MP3', { loop: true }),
      splash03: mkAudio('/sounds/6-1-1/6-1-1-8_Scrubbing.MP3', { loop: true }),
      splash04: mkAudio('/sounds/6-1-1/6-1-1-9-1.MP3', { loop: true }),
    }
    narrationRef.current = mkAudio('', { loop: false })
  }, [])

  useEffect(() => {
    const unlock = async () => {
      if (unlockedRef.current) return
      unlockedRef.current = true
      const wipes = wipingMapRef.current
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
        if (narrationRef.current) {
          narrationRef.current.src = ''
          narrationRef.current.load()
        }
      } catch {}
    }
    const onPointer = () => unlock()
    window.addEventListener('pointerdown', onPointer, { once: true })
    return () => {
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  const playSound = (path: string, volume = 0.7) => {
    try {
      const a = new Audio(path)
      a.volume = volume
      ;(a as any).playsInline = true
      a.play().catch(() => {})
    } catch {}
  }

  const playNarration = (path: string) => {
    try {
      if (!narrationRef.current) narrationRef.current = mkAudio('', { loop: false })
      const n = narrationRef.current
      n.pause()
      n.currentTime = 0
      n.src = path
      n.volume = 0.7
      n.loop = false
      n.play().catch(() => {})
    } catch {}
  }

  const liquidMessageNarrations: Record<SplashType, string> = {
    splash01: '/sounds/6-1-1/narration/6-1-1-J.MP3',
    splash02: '/sounds/6-1-1/narration/6-1-1-J.MP3',
    splash03: '/sounds/6-1-1/narration/6-1-1-J.MP3',
    splash04: '/sounds/6-1-1/narration/6-1-1-J.MP3',
  }

  const clickMessageNarrations: Record<SplashType, string> = {
    splash01: '/sounds/6-1-1/narration/6-1-1-A-3.MP3',
    splash02: '/sounds/6-1-1/narration/6-1-1-C-3.MP3',
    splash03: '/sounds/6-1-1/narration/6-1-1-E-3.MP3',
    splash04: '/sounds/6-1-1/narration/6-1-1-G-3.MP3',
  }

  const playLiquidMessageNarration = (splashType: SplashType) => {
    if (liquidMessageNarrations[splashType]) {
      setTimeout(() => {
        playNarration(liquidMessageNarrations[splashType])
      }, 800)
    }
  }

  const playClickMessageNarration = (splashType: SplashType) => {
    if (clickMessageNarrations[splashType]) {
      setTimeout(() => {
        playNarration(clickMessageNarrations[splashType])
      }, 800)
    }
  }

  const ensureWipeTrack = (key: SplashType) => {
    const wipes = wipingMapRef.current
    if (!wipes) return null
    const a = wipes[key]
    if (a.paused) {
      a.currentTime = 0
      a.volume = 0
      a.play().catch(() => {})
    }
    return a
  }

  const playWipingSound = (currentMission: SplashType, velocity: number) => {
    const now = Date.now()
    lastWipingAtRef.current = now

    const a = ensureWipeTrack(currentMission)
    if (!a) return

    currentWipeKeyRef.current = currentMission

    const targetVol = Math.min(0.75, 0.25 + velocity * 0.02)
    const targetRate = Math.min(1.6, 0.9 + velocity * 0.03)

    a.playbackRate = targetRate
    a.volume += (targetVol - a.volume) * 0.35
  }

  const fadeWipingSound = () => {
    const key = currentWipeKeyRef.current
    if (!key || !wipingMapRef.current) return
    const a = wipingMapRef.current[key]
    if (!a) return
    a.volume += (0 - a.volume) * 0.2
    if (a.volume < 0.01) a.volume = 0
  }

  const stopWipingAudio = () => {
    if (!wipingMapRef.current) return
    for (const k of Object.keys(wipingMapRef.current) as (keyof WipeAudios)[]) {
      const a = wipingMapRef.current[k]
      a.pause()
      a.currentTime = 0
      a.volume = 0
    }
    currentWipeKeyRef.current = null
  }

  const stopAllAudio = () => {
    try {
      stopWipingAudio()
      if (narrationRef.current) {
        narrationRef.current.pause()
        narrationRef.current.currentTime = 0
      }
      document.querySelectorAll('audio').forEach((el) => {
        if (!el.paused) {
          el.pause()
          el.currentTime = 0
        }
      })
    } catch {}
  }

  return {
    playSound,
    playNarration,
    playLiquidMessageNarration,
    playClickMessageNarration,
    playWipingSound,
    fadeWipingSound,
    stopAllAudio,
    stopWipingAudio,
  }
}
