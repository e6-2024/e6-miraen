import { useState } from 'react'
import { BoxLineGeometry } from 'three-stdlib'
import { AnimatePresence, motion } from 'framer-motion'

type Season = 'spring' | 'summer' | 'fall' | 'winter'

interface UIProps {
  isLockedToSurface: boolean
  activeSeason: Season | null
  onReset: () => void
}

const seasonExplain = {
  summer: {
    text: '겨울철 자정에 남쪽 하늘을 바라보면 겨울철 대표적인 별자리인 쌍둥이자리, 오리온자리, 큰개자리를 관찰할 수 있습니다. 또한 동쪽에서는 봄철 대표적인 별자리를, 서쪽에서는 가을철 대표적인 별자리를 관찰할 수 있습니다.',
    audio: '/sounds/6-1-4/narration/6-1-4-D.MP3',
  },
  fall: {
    text: '가을철 자정에 남쪽 하늘을 바라보면 가을철 대표적인 별자리인 안드로메다자리, 페가수스자리, 물고기자리를 관찰할 수 있습니다. 또한 동쪽에서는 겨울철 대표적인 별자리를, 서쪽에서는 여름철 대표적인 별자리를 관찰할 수 있습니다.',
    audio: '/sounds/6-1-4/narration/6-1-4-C.MP3',
  },
  winter: {
    text: '여름철 자정에 남쪽 하늘을 바라보면 여름철 대표적인 별자리인 백조자리, 거문고자리, 독수리자리를 관찰할 수 있습니다. 또한 동쪽에서는 가을철 대표적인 별자리를, 서쪽에서는 봄철 대표적인 별자리를 관찰할 수 있습니다.',
    audio: '/sounds/6-1-4/narration/6-1-4-B.MP3',
  },
  spring: {
    text: '봄철 자정에 남쪽 하늘을 바라보면 봄철 대표적인 별자리인 목동자리, 처녀자리, 사자자리를 관찰할 수 있습니다. 또한 동쪽에서는 여름철 대표적인 별자리를, 서쪽에서는 겨울철 대표적인 별자리를 관찰할 수 있습니다.',
    audio: '/sounds/6-1-4/narration/6-1-4-A.MP3',
  },
}

const seasonTitle = {
  summer : {
    title : '12/21 자정 남쪽 하늘'
  },
  fall : {
    title : '9/21 자정 남쪽 하늘'
  },
  winter : {
    title : '6/21 자정 남쪽 하늘'
  },
  spring : {
    title : '3/21 자정 남쪽 하늘'
  }
}

export function UI({ isLockedToSurface, activeSeason, onReset }: UIProps) {
  const [showExplainPopup, setShowExplainPopup] = useState(false)

  const handleShowExplain = () => {
    playClickSound()
    setShowExplainPopup(true)
  }

  // Store audio instance to control playback
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null)

  // Stop and clean up audio
  const stopAll = () => {
    if (audioInstance) {
      audioInstance.pause()
      audioInstance.currentTime = 0
      setAudioInstance(null)
    }
  }

  // Modified playClickSound to optionally set audio instance
  const playClickSound = (
    audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3',
    setAsInstance: boolean = false,
  ) => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.3
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
      if (setAsInstance) {
        stopAll()
        setAudioInstance(audio)
      }
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  // Play narration audio and store instance
  const playAudio = () => {
    if (activeSeason) {
      const audioPath = seasonExplain[activeSeason].audio
      playClickSound(audioPath, true)
    }
  }

  // Stop audio when popup closes
  const handleCloseExplain = () => {
    playClickSound()
    stopAll()
    setShowExplainPopup(false)
  }

  // Stop audio when reset
  const handleReset = () => {
    playClickSound()
    stopAll()
    setShowExplainPopup(false)
    onReset()
  }
  return (
    <>
      {!isLockedToSurface && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className='absolute top-4 right-4 z-10 w-fit h-fit'>
            <div className='text-center justify-center text-white text-lg font-light [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
              ※이 모델은 태양, 지구, 별자리의 상대적인 크기와 거리를 고려하지 않은 것입니다.
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {isLockedToSurface && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className='absolute top-4 left-4 z-10 w-fit h-fit'>
            <button
              onClick={handleReset}
              className='px-6 pt-3 pb-4 bg-[#4CAF50] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(0,152,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#66BB6A] hover:shadow-[inset_0px_-10px_10px_0px_rgba(0,152,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(0,152,0,0.50)] transition-all duration-300'
              aria-label='돌아가기'>
              <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                돌아가기
              </div>
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {isLockedToSurface && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'easeInOut' }}
            className='absolute bottom-4 left-1/2 z-10 w-fit h-fit transform -translate-x-1/2'>
              <div className='text-center justify-center text-white text-xl font-light [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                {seasonTitle[activeSeason].title}
              </div>
          </motion.div>
        </AnimatePresence>
      )}

      {isLockedToSurface && !showExplainPopup && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className='absolute top-4 right-4 z-10 w-fit h-fit'>
            <button
              onClick={() => {
                handleShowExplain()
                playAudio()
              }}
              className='px-6 pt-3 pb-4 bg-[#4CAF50] rounded-[20px] shadow-[inset_0px_-10px_10px_0px_rgba(0,152,0,0.50)] inline-flex justify-center items-center gap-2.5 overflow-hidden hover:bg-[#66BB6A] hover:shadow-[inset_0px_-10px_10px_0px_rgba(0,152,0,0.70)] active:scale-90 active:translate-y-2 active:shadow-[inset_0px_-2px_2px_0px_rgba(0,152,0,0.50)] transition-all duration-300'
              aria-label='정리하기'>
              <div className='text-center justify-center text-white text-2xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
                추가 설명 읽기
              </div>
            </button>
          </motion.div>
        </AnimatePresence>
      )}
      {showExplainPopup && activeSeason && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className='absolute flex flex-col justify-center items-center gap-5 bg-white p-4 rounded top-1/2 left-1/2 transform -translate-x-1/2 transform -translate-y-1/2 z-10 w-[40vw]'>
            <div className='text-center justify-center text-black text-xl font-bold [text-shadow:_0px_0px_4px_rgb(0_0_0_/_0.25)]'>
              {seasonExplain[activeSeason].text}
            </div>

            <button
              onClick={() => {
                handleCloseExplain()
                stopAll()
              }}
              className='rounded py-2 px-4 bg-[#4CAF50] font-light'>
              확인
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </>
  )
}

export default UI
