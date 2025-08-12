import { useState, useEffect, useCallback, useRef } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import SpaceScene from '@/scenes/SpaceScene'
import Intro from '@/components/intro/Intro'
import ActivityGuideModal from '@/components/6-1-4/ActivityGuideModal'
import { CrayonTextButton } from '@/components/CrayonUIButton'

type Season = 'spring' | 'summer' | 'fall' | 'winter'

export default function HomePage() {
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null)
  const [activeSeason, setActiveSeason] = useState<Season | null>(null)
  const [isLockedToSurface, setIsLockedToSurface] = useState(false)

  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showActivityGuide, setShowActivityGuide] = useState(false)

  // === BGM 관리: 단일 인스턴스 ===
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bgmEnabled')
      return saved ? JSON.parse(saved) : true
    }
    return true
  })
  const [bgmReady, setBgmReady] = useState(false) // 사용자 제스처 이후 true

  // 인스턴스 준비
  useEffect(() => {
    const el = new Audio('/sounds/6-1-4/6-1-4-BGM_airy-196973.mp3')
    el.loop = true
    el.volume = 0.3
    bgmRef.current = el
    return () => {
      el.pause()
      bgmRef.current = null
    }
  }, [])

  // 상태 반영
  useEffect(() => {
    if (!bgmRef.current) return
    localStorage.setItem('bgmEnabled', JSON.stringify(bgmEnabled))
    if (bgmEnabled && bgmReady) {
      bgmRef.current.play().catch((e) => {
        // 자동재생 차단 시 무시
        // console.log('BGM play blocked:', e?.name ?? e)
      })
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

  // 효과음(클릭)
  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch(() => {})
    } catch {}
  }

  // 입장
  const handleEnterExperience = () => {
    playClickSound()
    setBgmReady(true) // 사용자 제스처 이후 재생 허용
    setTimeout(() => setShowIntro(false), 300)
  }

  // 별 클릭
  const handleEarthClick = (position: [number, number, number], season: Season) => {
    if (showIntro) return
    setCameraTarget(position)
    setActiveSeason(season)
    setIsLockedToSurface(true)
  }

  // 리셋
  const handleReset = () => {
    setCameraTarget(null)
    setActiveSeason(null)
    setIsLockedToSurface(false)
  }

  // 뒤로가기
  const handleBackToIntro = useCallback(() => {
    playClickSound()
    setCameraTarget(null)
    setActiveSeason(null)
    setIsLockedToSurface(false)
    setTimeout(() => setShowIntro(true), 100)
  }, [])

  // 가이드 모달
  const handleShowActivityGuide = () => setShowActivityGuide(true)
  const handleCloseActivityGuide = () => setShowActivityGuide(false)

  return (
    <div className='fixed inset-0 bg-black'>
      <SpaceScene
        onEarthClick={handleEarthClick}
        cameraTarget={cameraTarget}
        activeSeason={activeSeason}
        isLockedToSurface={isLockedToSurface}
        onReset={handleReset}
      />
      <CrayonTextButton
        icon={bgmEnabled ? 'volume2' : 'volumeX'}
        position='absolute'
        iconPosition='left'
        onClick={toggleBgm}
        width={108}
        height={108}
        color='#ffffff'
        textcolor='#ffffff'
        bg='rgba(255,255,255,0.10)'
        className='background-blur border-white/20 z-[1300]'
        right={16}
        bottom={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='계절별 대표적인 별자리 관찰하기'
          description={[
            '지구의 공전으로 나타나는 계절별 지구의 위치 변화와 이에 따라 달라지는 계절별 대표적인 별자리를 확인해 봅시다.',
          ]}
          onActivityGuide={handleShowActivityGuide}
          backgroundSvg='/img/cover/6-1-4.svg'
          descriptionSound='/sounds/6-1-4/narration/6-1-4-Goal.MP3'
        />
      )}

      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}
