import { useState, useEffect } from 'react'
import SpaceScene from '@/scenes/SpaceScene' 
import Intro from '@/components/intro/Intro'

type Season = 'spring' | 'summer' | 'fall' | 'winter'

export default function HomePage() {
  const [cameraTarget, setCameraTarget] = useState<[number, number, number] | null>(null)
  const [activeSeason, setActiveSeason] = useState<Season | null>(null)
  const [isLockedToSurface, setIsLockedToSurface] = useState(false)

  // Intro 관련 상태 추가
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // 간단한 로딩 완료 처리 (SpaceScene이 마운트된 후)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 1000) // 1초 후 로딩 완료로 간주

    return () => clearTimeout(timer)
  }, [])


  const handleEarthClick = (position: [number, number, number], season: Season) => {
    // Intro가 보일 때는 지구 클릭 비 활성화
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
      audio.play().catch(error => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const handleEnterExperience = () => {
    // 효과음 재생
    playClickSound()
    
    // 효과음이 재생될 시간을 확보한 후 Intro 숨김
    setTimeout(() => {
      setShowIntro(false)
    }, 300) // 300ms 지연
  }



  return (
    <div className="fixed inset-0 bg-black">
      <SpaceScene
        onEarthClick={handleEarthClick}
        cameraTarget={cameraTarget}
        activeSeason={activeSeason}
        isLockedToSurface={isLockedToSurface}
        onReset={handleReset}
      />

      {/* Intro 오버레이 - 로딩 완료 후 표시 */}
      {isLoaded && showIntro && (
        <Intro 
          onEnter={handleEnterExperience}
          title="지구의 운동"
          description={[
            "지구는 공전하며 위치가 달라집니다. 계절별 대표적인 별자리가 달라지는 까닭은 지구의 공전과 어떤 관계가 있는지 알아봅시다."
          ]}
          simbolSvgPath="/img/icon/지구의운동.svg"
        />
      )}
    </div>
  )
}