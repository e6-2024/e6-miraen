import { useRef, useState, useImperativeHandle, forwardRef } from 'react'

export interface NavigationUIRef {
  stopAllAudios: () => void
}

const NavigationUI = forwardRef<
  NavigationUIRef,
  {
    sceneIndex: number
    onSceneChange: (index: number) => void
    onPlayClick: () => void
    isAnimationComplete: boolean
    animationState?: { isPlaying: boolean; isComplete: boolean; waterLevel: number }
  }
>(({ sceneIndex, onSceneChange, onPlayClick, isAnimationComplete, animationState }, ref) => {
  const currentAudiosRef = useRef<HTMLAudioElement[]>([])
  const [isPlayButtonPressed, setIsPlayButtonPressed] = useState(false)

  const stopAllAudios = () => {
    console.log('NavigationUI: Stopping all audios:', currentAudiosRef.current.length)
    currentAudiosRef.current.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
      audio.removeEventListener('ended', () => {})
      audio.removeEventListener('error', () => {})
    })
    currentAudiosRef.current = []
  }

  useImperativeHandle(ref, () => ({
    stopAllAudios,
  }))

  const stepAudioFiles = {
    0: ['sounds/5-1-1/5-1-1-D.MP3', '/sounds/5-1-1/5-1-1-0_0626.MP3'],
    1: ['/sounds/5-1-1/5-1-1-A.MP3', '/sounds/5-1-1/5-1-1-2-1_lake-beach-waves-28492.mp3'],
    2: ['/sounds/5-1-1/5-1-1-E.MP3', '/sounds/5-1-1/5-1-1-3_forest-atmosphere-003localization-poland-329746.mp3'],
    3: ['/sounds/5-1-1/5-1-1-C.MP3', '/sounds/5-1-1/5-1-1-4_footfalls-35757.mp3'],
  }

  const description = ['공룡의 생활 모습', '퇴적물에 묻히는 공룡', '지층 속 공룡 화석', '공룡 화석의 발견']

  const playStepAudio = () => {
    stopAllAudios()

    const audioPaths = stepAudioFiles[sceneIndex as keyof typeof stepAudioFiles]

    audioPaths.forEach((audioPath, index) => {
      try {
        const audio = new Audio(audioPath)
        audio.volume = 0.5

        const handleEnded = () => {
          const audioIndex = currentAudiosRef.current.indexOf(audio)
          if (audioIndex > -1) {
            currentAudiosRef.current.splice(audioIndex, 1)
          }
        }

        const handleError = (error: any) => {
          console.log(`오디오 ${index + 1} 재생 실패:`, error)
          const audioIndex = currentAudiosRef.current.indexOf(audio)
          if (audioIndex > -1) {
            currentAudiosRef.current.splice(audioIndex, 1)
          }
        }

        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)

        currentAudiosRef.current.push(audio)

        setTimeout(() => {
          audio.play().catch(handleError)
        }, index * 100)
      } catch (error) {
        console.log(`오디오 ${index + 1} 생성 실패:`, error)
      }
    })
  }

  const handleSceneChange = (index: number) => {
    stopAllAudios()
    onSceneChange(index)
  }

  const handlePlayClick = () => {
    setIsPlayButtonPressed(true)

    // 버튼 애니메이션을 위한 짧은 지연
    setTimeout(() => {
      setIsPlayButtonPressed(false)
      playStepAudio()
      onPlayClick()
    }, 150)
  }

  return (
    <div className='absolute flex flex-row left-1/2 top-4 transform -translate-x-1/2 z-10 justify-center items-center'>
      <div className='flex items-center justify-center p-4 text-white z-10'>
        <div className='flex items-center justify-center bg-gray-800/50 rounded-full px-8 py-4 backdrop-blur-sm'>
          {[1, 2, 3, 4].map((num) => (
            <>
              <div className='flex flex-col justify-center items-center'>
                <button
                  key={num - 1}
                  onClick={() => handleSceneChange(num - 1)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all relative ${
                    sceneIndex === num - 1
                      ? 'bg-blue-500 shadow-lg scale-110'
                      : sceneIndex > num - 1
                      ? 'bg-green-500/80 hover:bg-green-500'
                      : 'bg-gray-700/80 hover:bg-gray-600'
                  }`}>
                  <img src={`/img/icon/icon${num}.png`} alt={`Step ${num}`} className='w-16 h-16 object-contain' />
                  {sceneIndex > num - 1 && (
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <svg className='w-8 h-8 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  )}
                </button>
                <div className='pt-2 text-center font-light text-sm break-keep'>
                  <p>{description[num - 1]}</p>
                </div>
              </div>
              {num < 4 && (
                <div className='flex items-center pb-11 mx-3'>
                  <svg width='48' height='32' viewBox='0 0 32 16' className='transition-all'>
                    <path
                      d='M0 4 L20 4 L20 1 L32 8 L20 15 L20 12 L0 12 Z'
                      fill={sceneIndex >= num ? '#fff' : '#4b5563'}
                      className='transition-colors'
                    />
                  </svg>
                </div>
              )}
            </>
          ))}
        </div>
      </div>

      {/* 플레이 버튼 (재생/초기화 기능 통합) */}
      <button
        onClick={handlePlayClick}
        disabled={isPlayButtonPressed}
        className='w-20 h-20 relative ml-6 z-10 cursor-pointer transition-all duration-150 hover:scale-105 disabled:cursor-not-allowed'>
        <div
          className={`w-full h-full left-0 absolute bg-amber-700 rounded-full transition-all duration-150 ${
            isPlayButtonPressed ? 'top-0' : 'top-[8px]'
          }`}></div>

        <div
          className={`w-full h-full left-0 absolute bg-gradient-to-b from-amber-400 to-amber-600 rounded-full transition-all duration-150 ${
            isPlayButtonPressed ? 'top-[5px] scale-95' : 'top-0'
          }`}></div>

        {/* 플레이/리플레이 버튼 */}
        {isAnimationComplete || animationState?.isPlaying ? (
          // 리플레이 버튼 (애니메이션 재생 중이거나 완료된 경우)
          <svg
            className={`w-8 h-8 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
              isPlayButtonPressed ? 'scale-90' : 'scale-100'
            }`}
            fill='white'
            viewBox='0 0 24 24'>
            <path d='M12 4V2.21c0-.45-.54-.67-.85-.35L9.35 3.64c-.2.2-.2.51 0 .71l1.79 1.79c.32.31.86.09.86-.36V4c3.31 0 6 2.69 6 6 0 .79-.15 1.56-.44 2.25-.15.36-.04.77.23 1.04.51.51 1.37.33 1.64-.34.37-.91.57-1.91.57-2.95 0-4.42-3.58-8-8-8z' />
            <path d='M12 20v1.79c0 .45.54.67.85.35l1.79-1.79c.2-.2.2-.51 0-.71l-1.79-1.79c-.32-.31-.86-.09-.86.36V20c-3.31 0-6-2.69-6-6 0-.79.15-1.56.44-2.25.15-.36.04-.77-.23-1.04-.51-.51-1.37-.33-1.64.34C4.4 12.05 4.2 13.05 4.2 14.1c0 4.42 3.58 8 8 8z' />
          </svg>
        ) : (
          // 플레이 버튼 (초기 상태)
          <img
            src='/img/icon/Polygon 1.svg'
            alt='재생 아이콘'
            className={`w-10 h-10 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
              isPlayButtonPressed ? 'scale-90' : 'scale-100'
            }`}
          />
        )}
      </button>
    </div>
  )
})

NavigationUI.displayName = 'NavigationUI'

export default NavigationUI
