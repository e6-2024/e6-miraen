import { useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { CrayonTextButton } from '@/components/CrayonUIButton'
import { CrayonTextBox } from '../CrayonTextBox'

export interface NavigationUIRef {
  stopAllAudios: () => void
}

const VOLUME = {
  narration: 1, // 나레이션
  sfx: 0.5, // 효과음
}
const stepColors = {
  active: { bg: '#52AE46', border: '#FFF', text: '#FFFFFF' },
  done: { bg: '#52AE46', border: '#FFF', text: '#FFFFFF' },
  inactive: { bg: '#6B7280', border: '#4B5563', text: '#FFFFFF' },
}

const playColors = {
  play: { bg: '#F59E0B', border: '#B45309', text: '#FFFFFF' },
  replay: { bg: '#8B5CF6', border: '#6D28D9', text: '#FFFFFF' },
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
    const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

    audioPaths.forEach((audioPath, index) => {
      try {
        const audio = new Audio(audioPath)

        let isNarration = index === 0
        const narrationLike = /\/5-1-1-[A-Z]\.MP3$/i.test(audioPath)
        if (narrationLike) isNarration = true
        audio.volume = clamp01(isNarration ? VOLUME.narration : VOLUME.sfx)

        const handleEnded = () => {
          const audioIndex = currentAudiosRef.current.indexOf(audio)
          if (audioIndex > -1) currentAudiosRef.current.splice(audioIndex, 1)
        }

        const handleError = (error: any) => {
          console.log(`오디오 ${index + 1} 재생 실패:`, error)
          const audioIndex = currentAudiosRef.current.indexOf(audio)
          if (audioIndex > -1) currentAudiosRef.current.splice(audioIndex, 1)
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
    setIsPlayButtonPressed(false)

    onSceneChange(index)
  }

  const handlePlayClick = () => {
    setIsPlayButtonPressed(true)

    // 버튼 애니메이션을 위한 짧은 지연
    setTimeout(() => {
      playStepAudio()
      onPlayClick()
    }, 150)
  }

  return (
    <div className='absolute flex w-full justify-center left-1/2 -translate-x-1/2 items-center top-4  z-[200]'>
      <CrayonTextBox
        color='#52AE46'
        bg='white'
        padding={0}
        className='flex items-center justify-center background-blur'>
        <div className='flex items-center justify-center rounded-full px-6 py-4'>
          {/* 단계 버튼들 */}
          {[1, 2, 3, 4].map((num) => {
            const stepIdx = num - 1
            const isActive = sceneIndex === stepIdx
            const isDone = sceneIndex > stepIdx

            const scheme = isActive ? stepColors.active : isDone ? stepColors.done : stepColors.inactive

            return (
              <div key={num} className='flex items-center'>
                <div className='flex flex-col justify-center items-center'>
                  <div className='relative'>
                    <CrayonTextButton
                      ariaLabel={`단계 ${num}`}
                      width={90}
                      height={90}
                      bg={scheme.bg}
                      color={scheme.border}
                      textcolor={scheme.text}
                      className={`rounded-full transition-all duration-200 ${
                        !isActive && !isDone ? 'opacity-60' : 'opacity-100'
                      }`}
                      onClick={() => handleSceneChange(stepIdx)}
                      innerCircleVisible={false}
                    />

                    {!isDone ? (
                      <img
                        src={`/img/icon/icon${num}.png`}
                        alt={`Step ${num}`}
                        className='pointer-events-none w-14 h-14 object-contain absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
                      />
                    ) : (
                      <svg
                        className='absolute pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow'
                        width='48'
                        height='48'
                        viewBox='2 2 16 16'
                        fill='currentColor'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    )}
                  </div>

                  {/* 설명 */}
                  <div className='text-center font-light text-[16px] whitespace-nowrap'>
                    <p>{description[stepIdx]}</p>
                  </div>
                </div>

                {/* 화살표 */}
                {num < 4 && (
                  <div className='flex items-center pb-11 mx-2 sm:mx-3'>
                    <svg width='48' height='32' viewBox='0 0 32 16' className='transition-all'>
                      <path
                        d='M0 4 L20 4 L20 1 L32 8 L20 15 L20 12 L0 12 Z'
                        fill={sceneIndex >= num ? '#000' : '#888'}
                        className='transition-colors'
                      />
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CrayonTextBox>
      <CrayonTextButton
        ariaLabel='모드 선택 화면으로 돌아가기'
        text={isPlayButtonPressed ? '다시하기' : '재생하기'}
        position='absolute'
        icon={isPlayButtonPressed ? 'replay' : 'play'}
        iconPosition='left'
        width={170}
        height={75}
        iconSize={30}
        left={10}
        top={10}
        bg='#52AE46'
        color='#A1CC90'
        textcolor='#FFFFFF'
        className='background-blur border-white/20 z-[1300]'
        onClick={handlePlayClick}
      />
    </div>
  )
})

NavigationUI.displayName = 'NavigationUI'

export default NavigationUI
