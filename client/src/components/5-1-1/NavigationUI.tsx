import { useRef } from 'react'

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
              {num < 4 && (
                <div className='flex items-center mx-3'>
                  <div
                    className={`w-16 h-1 rounded-full transition-all ${
                      sceneIndex >= num ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  />
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
    </div>
  )
}