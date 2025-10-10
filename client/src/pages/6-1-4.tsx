'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import SpaceScene from '@/scenes/SpaceScene'
import Intro from '@/components/intro/Intro'
import ActivityGuideModal from '@/components/6-1-4/ActivityGuideModal'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'

type ButtonStyle = { bg: string; border: string; text: string }
type SpaceTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}
const spaceTheme: SpaceTheme = {
  goal: { bg: '#05A8A4', border: '#7BCACA', text: '#FFFFFF' },
  guide: { bg: '#05A8A4', border: '#7BCACA', text: '#FFFFFF' },
  start: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
}
type Season = 'spring' | 'summer' | 'fall' | 'winter'

export default function HomePage() {
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null)
  const [activeSeason, setActiveSeason] = useState<Season | null>(null)
  const [isLockedToSurface, setIsLockedToSurface] = useState(false)
  const [sceneKey, setSceneKey] = useState(0)

  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showActivityGuide, setShowActivityGuide] = useState(false)

  // 마운트 여부 (SSR ↔ CSR 불일치 예방용)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // === BGM 관리 ===
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  // 서버/초기 렌더에서는 고정값으로 시작 (ex: true)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  // 마운트 후 localStorage 동기화 (이 시점 변경은 hydration에 영향 없음)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [])

  // 인스턴스 준비 (클라 전용)
  useEffect(() => {
    const el = new Audio('/sounds/6-1-4/6-1-4-BGM_airy-196973.mp3')
    el.loop = true
    el.volume = 0.1
    bgmRef.current = el
    return () => {
      el.pause()
      bgmRef.current = null
    }
  }, [])

  // 상태 반영
  useEffect(() => {
    if (!bgmRef.current) return
    try {
      localStorage.setItem('bgmEnabled', JSON.stringify(bgmEnabled))
    } catch {}
    if (bgmEnabled && bgmReady) {
      bgmRef.current.play().catch(() => {})
    } else {
      bgmRef.current.pause()
    }
  }, [bgmEnabled, bgmReady])

  const toggleBgm = () => setBgmEnabled((v) => !v)

  // 로딩 딜레이
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const playClickSound = (p = '/sounds/Enter_Cute.mp3') => {
    try {
      const a = new Audio(p)
      a.volume = 0.7
      a.play().catch(() => {})
    } catch {}
  }

  const handleEnterExperience = () => {
    playClickSound()
    setBgmReady(true)
    setTimeout(() => setShowIntro(false), 300)
  }
  
  

  const resetToIntro = useCallback(() => {
    playClickSound()
    setCameraTarget(null)
    setActiveSeason(null)
    setIsLockedToSurface(false)

    setShowActivityGuide(false)
    setShowIntro(true)
    setSceneKey((k) => k + 1)
  }, [])

  const handleEarthClick = (pos: [number, number, number], season: Season) => {
    if (showIntro) return
    setCameraTarget(pos)
    setActiveSeason(season)
    setIsLockedToSurface(true)
  }

  const handleReset = () => {
    setCameraTarget(null)
    setActiveSeason(null)
    setIsLockedToSurface(false)
  }

  const handleBackToIntro = useCallback(() => {
    playClickSound()
    setCameraTarget(null)
    setActiveSeason(null)
    setIsLockedToSurface(false)
    setTimeout(() => setShowIntro(true), 100)
  }, [])

  return (
    <div className='fixed inset-0 bg-black'>
      <SpaceScene
        key={sceneKey}
        onEarthClick={handleEarthClick}
        cameraTarget={cameraTarget}
        activeSeason={activeSeason}
        isLockedToSurface={isLockedToSurface}
        onReset={handleReset}
      />

      {/* 마운트 이후에만 버튼 렌더 -> SSR/C SR DOM 일치 보장 */}
      {mounted && (
        <>
          <CrayonTextButton
            ariaLabel={'첫 화면으로'}
            icon={'home'}
            position='absolute'
            iconPosition='left'
            onClick={resetToIntro}
            width={96}
            height={96}
            color='#ffffff'
            textcolor='#ffffff'
            bg={spaceTheme.goal.bg}
            className='z-[1000]'
            right={120}
            top={16}
            iconSize={40}
          />
          <CrayonTextButton
            icon={bgmEnabled ? 'volume2' : 'volumeX'}
            position='absolute'
            iconPosition='left'
            onClick={toggleBgm}
            width={96}
            height={96}
            color='#ffffff'
            textcolor='#ffffff'
            bg={spaceTheme.goal.bg}
            className='z-[1000]'
            right={16}
            top={16}
            iconSize={40}
            innerCircleVisible={true}
          />
        </>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='계절별 대표적인 별자리 관찰하기'
          description={[
            '지구의 공전으로 나타나는 계절별 지구의 위치 변화와',
            '이에 따라 달라지는 계절별 대표적인 별자리를 확인해 봅시다.',
          ]}
          onActivityGuide={() => setShowActivityGuide(true)}
          backgroundSvg='/img/cover/6-1-4.svg'
          descriptionSound='/sounds/6-1-4/narration/6-1-4-Goal.MP3'
          buttonTheme={spaceTheme}
        />
      )}

      <ActivityGuideModal isOpen={showActivityGuide} onClose={() => setShowActivityGuide(false)} />
    </div>
  )
}
