import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import SpaceScene from '@/scenes/SpaceScene'
import Intro from '@/components/intro/Intro'

type Season = 'spring' | 'summer' | 'fall' | 'winter'

export default function HomePage() {
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null)
  const [activeSeason, setActiveSeason] = useState<Season | null>(null)
  const [isLockedToSurface, setIsLockedToSurface] = useState(false)

  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleEarthClick = (position: [number, number, number], season: Season) => {
    if (showIntro) return

    setCameraTarget(position)
    setActiveSeason(season)
    setIsLockedToSurface(true)
  }

  const handleReset = () => {
    setCameraTarget(null)
    setActiveSeason(null)
    setIsLockedToSurface(false)
  }

  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playBGSound = (audioPath: string = '/sounds/6-1-4/6-1-4-BGM_airy-196973.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.3
      audio.loop = true

      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const handleEnterExperience = () => {
    playClickSound()
    playBGSound()

    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }

  // 뒤로가기 핸들러 추가
  const handleBackToIntro = useCallback(() => {
    playClickSound()
    
    // 현재 상태 초기화
    setCameraTarget(null)
    setActiveSeason(null)
    setIsLockedToSurface(false)
    
    setTimeout(() => {
      setShowIntro(true)
    }, 100)
  }, [playClickSound])

  return (
    <div className='fixed inset-0 bg-black'>
      {/* 뒤로가기 버튼 */}
      <AnimatePresence>
        {!showIntro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className='absolute top-4 left-4 z-10 w-fit h-fit'>
            <button
              onClick={handleBackToIntro}
              className='px-6 pt-3 pb-4 bg-[#FF8026] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#ff9b54] hover:shadow-[inset_0px_-10px_10px_0px_rgba(152,0,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(152,0,0,0.50)] transition-all duration-300'
              aria-label='인트로 화면으로 돌아가기'>
              <div className='text-center justify-center text-white text-xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                뒤로가기
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <SpaceScene
        onEarthClick={handleEarthClick}
        cameraTarget={cameraTarget}
        activeSeason={activeSeason}
        isLockedToSurface={isLockedToSurface}
        onReset={handleReset}
      />

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='계절별 대표적인 별자리 관찰하기'
          description={[
            '지구의 공전으로 나타나는 계절별 지구의 위치 변화와 이에 따라 달라지는 계절별 대표적인 별자리를 확인해 봅시다.',
          ]}
          backgroundSvg='/img/cover/6-1-4.svg'
          descriptionSound='/sounds/6-1-4/narration/6-1-4-Goal.MP3'
        />
      )}
    </div>
  )
}