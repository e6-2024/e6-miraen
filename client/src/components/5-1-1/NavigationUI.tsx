import { useRef, useState } from 'react'

export default function NavigationUI({
  sceneIndex,
  onSceneChange,
  onPlayClick,
  isPlayButtonPressed,
}: {
  sceneIndex: number
  onSceneChange: (index: number) => void
  onPlayClick: () => void
  isPlayButtonPressed: boolean
}) {
  const currentAudiosRef = useRef<HTMLAudioElement[]>([])

  const [isResetButtonPressed, setResetButtonPressed] = useState(false)

  const stopAllAudios = () => {
    currentAudiosRef.current.forEach((audio) => {
      audio.pause()
      audio.currentTime = 0
    })
    currentAudiosRef.current = []
  }

  const stepAudioFiles = {
    0: ['/sounds/5-1-1/5-1-1-0_0626.MP3'],
    1: ['/sounds/5-1-1/5-1-1-A.MP3', '/sounds/5-1-1/5-1-1-2-1_lake-beach-waves-28492.mp3'],
    2: ['/sounds/5-1-1/5-1-1-B.MP3', '/sounds/5-1-1/5-1-1-3_forest-atmosphere-003localization-poland-329746.mp3'],
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

        currentAudiosRef.current.push(audio)

        setTimeout(() => {
          audio.play().catch((error) => {
            console.log(`오디오 ${index + 1} 재생 실패:`, error.name)
          })
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
    playStepAudio()
    onPlayClick()
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
                <div className='flex items-center mx-3'>
                  <svg width='32' height='16' viewBox='0 0 32 16' className='transition-all'>
                    <path
                      d='M0 6 L24 6 L24 4 L32 8 L24 12 L24 10 L0 10 Z'
                      fill={sceneIndex >= num ? '#3b82f6' : '#4b5563'}
                      className='transition-colors'
                    />
                  </svg>
                </div>
              )}
            </>
          ))}
        </div>
      </div>
      <button
        onClick={handlePlayClick}
        className='w-20 h-20 relative ml-6 z-10 cursor-pointer transition-all duration-150 hover:scale-105'>
        <div
          className={`w-full h-full left-0 absolute bg-amber-700 rounded-full transition-all duration-150 ${
            isPlayButtonPressed ? 'top-0' : 'top-[8px]'
          }`}></div>

        <div
          className={`w-full h-full left-0 absolute bg-gradient-to-b from-amber-400 to-amber-600 rounded-full transition-all duration-150 ${
            isPlayButtonPressed ? 'top-[5px] scale-95' : 'top-0'
          }`}></div>

        <img
          src='/img/icon/Polygon 1.svg'
          alt='지층 아이콘'
          className={`w-10 h-10 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
            isPlayButtonPressed ? 'scale-90' : 'scale-100'
          }`}
        />
      </button>
      {sceneIndex !== 0 && (
        <button
          onClick={() => {
            handleSceneChange(0)
          }}
          className='w-20 h-20 relative ml-6 z-10 cursor-pointer transition-all duration-150 hover:scale-105'>
          <div
            className={`w-full h-full left-0 absolute bg-slate-700 rounded-full transition-all duration-150 ${
              isResetButtonPressed ? 'top-0' : 'top-[8px]'
            }`}></div>

          <div
            className={`w-full h-full left-0 absolute bg-gradient-to-b from-slate-400 to-slate-600 rounded-full transition-all duration-150 ${
              isResetButtonPressed ? 'top-[5px] scale-95' : 'top-0'
            }`}></div>
          <svg
            className={`w-8 h-8 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
              isResetButtonPressed ? 'scale-90' : 'scale-100'
            }`}
            fill='white'
            viewBox='0 0 24 24'>
            <path d='M12 4V2.21c0-.45-.54-.67-.85-.35L9.35 3.64c-.2.2-.2.51 0 .71l1.79 1.79c.32.31.86.09.86-.36V4c3.31 0 6 2.69 6 6 0 .79-.15 1.56-.44 2.25-.15.36-.04.77.23 1.04.51.51 1.37.33 1.64-.34.37-.91.57-1.91.57-2.95 0-4.42-3.58-8-8-8z' />
            <path d='M12 20v1.79c0 .45.54.67.85.35l1.79-1.79c.2-.2.2-.51 0-.71l-1.79-1.79c-.32-.31-.86-.09-.86.36V20c-3.31 0-6-2.69-6-6 0-.79.15-1.56.44-2.25.15-.36.04-.77-.23-1.04-.51-.51-1.37-.33-1.64.34C4.4 12.05 4.2 13.05 4.2 14.1c0 4.42 3.58 8 8 8z' />
          </svg>
        </button>
      )}
    </div>
  )
}