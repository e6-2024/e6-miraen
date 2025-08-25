import { useState, useCallback, useEffect } from 'react'
import { BoxLineGeometry } from 'three-stdlib'
import { AnimatePresence, motion } from 'framer-motion'
import { CrayonTextBox } from '../CrayonTextBox'
import { CrayonTextButton } from '../CrayonUIButton'

type Season = 'spring' | 'summer' | 'fall' | 'winter'

interface UIProps {
  isLockedToSurface: boolean
  activeSeason: Season | null
  onReset: () => void
}

const seasonExplain = {
  summer: {
    text: '겨울철(동지경), 자정(밤 12시경)에 남쪽 하늘을 바라보면 겨울철 대표적인 별자리인 쌍둥이자리, 오리온자리, 큰개자리를 관찰할 수 있습니다. 또한 동쪽에서는 봄철 대표적인 별자리를, 서쪽에서는 가을철 대표적인 별자리를 관찰할 수 있습니다.',
    audio: '/sounds/6-1-4/narration/6-1-4-D.MP3',
  },
  fall: {
    text: '가을철(추분경), 자정(밤 12시경)에 남쪽 하늘을 바라보면 가을철 대표적인 별자리인 안드로메다자리, 페가수스자리, 물고기자리를 관찰할 수 있습니다. 또한 동쪽에서는 겨울철 대표적인 별자리를, 서쪽에서는 여름철 대표적인 별자리를 관찰할 수 있습니다.',
    audio: '/sounds/6-1-4/narration/6-1-4-C.MP3',
  },
  winter: {
    text: '여름철(하지경), 자정(밤 12시경)에 남쪽 하늘을 바라보면 여름철 대표적인 별자리인 백조자리, 거문고자리, 독수리자리를 관찰할 수 있습니다. 또한 동쪽에서는 가을철 대표적인 별자리를, 서쪽에서는 봄철 대표적인 별자리를 관찰할 수 있습니다.',
    audio: '/sounds/6-1-4/narration/6-1-4-B.MP3',
  },
  spring: {
    text: '봄철(춘분경), 자정(밤 12시경)에 남쪽 하늘을 바라보면 봄철 대표적인 별자리인 목동자리, 처녀자리, 사자자리를 관찰할 수 있습니다.\n또한 동쪽에서는 여름철 대표적인 별자리를, 서쪽에서는 겨울철 대표적인 별자리를 관찰할 수 있습니다.',
    audio: '/sounds/6-1-4/narration/6-1-4-A.MP3',
  },
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
  const stopAll = useCallback(() => {
    if (audioInstance) {
      audioInstance.pause()
      audioInstance.currentTime = 0
      setAudioInstance(null)
    }
  }, [audioInstance])

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
  const playAudio = () => {
    if (activeSeason) {
      const audioPath = seasonExplain[activeSeason].audio
      playClickSound(audioPath, true)
    }
  }

  const handleCloseExplain = () => {
    playClickSound()
    stopAll()
    setShowExplainPopup(false)
  }
  const handleReset = () => {
    playClickSound()
    stopAll()
    setShowExplainPopup(false)
    onReset()
  }

  useEffect(() => {
    return () => {
      stopAll()
    }
  }, [stopAll])
  
  return (
    <>
      {!isLockedToSurface && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className='absolute left-4 top-4 z-10 w-fit h-fit'>
            <CrayonTextBox
              textcolor='#333333'
              color='#fff'
              bg='#fff'
              padding={4}
              animated={true}
              text='※이 모델은 태양, 지구, 별자리의 상대적인 크기와 거리를 고려하지 않은 것입니다.'
            />
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
            className='top-4 left-4 z-10'>
            <CrayonTextButton
              position='absolute'
              iconPosition='left'
              x='10px'
              y='20px'
              width={170}
              height={75}
              onClick={handleReset}
              icon={'Arrowleft'}
              iconSize={30}
              text='첫 화면으로'
              color='#ffffff'
              textcolor='#ffffff'
              bg='rgba(255,255,255,0.10)'
              className='background-blur border-white/20 z-[1000]'
              innerCircleVisible={false}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {isLockedToSurface && !showExplainPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className=''>
          <CrayonTextButton
            position='absolute'
            iconPosition='left'
            x='50vw'
            y='87dvh'
            width={170}
            height={75}
            iconSize={30}
            text='추가 설명 읽기'
            color='#ffffff'
            textcolor='#ffffff'
            bg='rgba(255,255,255,0.10)'
            className='background-blur border-white/20 -translate-x-1/2 z-[1000]'
            innerCircleVisible={false}
            onClick={() => {
              handleShowExplain()
              playAudio()
            }}
          />
        </motion.div>
      )}

      {showExplainPopup && activeSeason && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className='absolute flex flex-col justify-center items-center font-bold gap-5 bg-white/85 px-4 pt-4 pb-24 rounded-xl top-1/2 left-1/2 transform -translate-x-1/2 transform -translate-y-1/2 z-10 w-[40vw]'>
            <CrayonTextBox
              text={seasonExplain[activeSeason].text}
              color='#333'
              bg='#fff'
              textcolor='#333'
              fontSize='18px'
              fontWeight='500'
              textAlign='left'
              padding={20}
              animated={true}></CrayonTextBox>

            <CrayonTextButton
              onClick={() => {
                handleCloseExplain()
                stopAll()
              }}
              position='absolute'
              className='top-32 rounded font-light'
              text='확인'
              textcolor='#333'
              color='#333'
              bg='#FFF'
            />
          </motion.div>
        </AnimatePresence>
      )}
    </>
  )
}

export default UI
