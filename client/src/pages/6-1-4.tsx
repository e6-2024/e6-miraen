import { useState, useEffect } from 'react'
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

  const playBGSound = (audioPath: string = '/sounds/6-1-4/space-rumble-29970.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
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

  return (
    <div className='fixed inset-0 bg-black'>
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
