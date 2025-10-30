'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { LoadingTracker } from '@/components/5-1-3/LoadingTracker'
import { ExperimentScene } from '@/components/5-1-3/ExperimentScene'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { CAMERA_CONFIG, playClickSound } from '@/utils/5-1-3/utils'
import { TiltOnMouse } from '@/components/common/Tilt'
import { TimedFade } from '@/components/5-1-3/TimeFade'
import { useGLTF } from '@react-three/drei'
import ActivityGuideModal from '@/components/5-1-3/ActivityGuideModal'
import AudioManager from '@/components/5-1-2/AudioManager'

type ButtonStyle = { bg: string; border: string; text: string }

type TomatoTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}

const tomatoTheme: TomatoTheme = {
  goal: { bg: '#05A8A4', border: '#7BCACA', text: '#FFFFFF' },
  guide: { bg: '#05A8A4', border: '#7BCACA', text: '#FFFFFF' },
  start: { bg: '#009BF5', border: '#9ED6E9', text: '#FFFFFF' },
}

const MODELS_TO_PRELOAD = [
  '/models/5-1-3/0.glb',
  '/models/5-1-3/Spoon_left.glb',
  '/models/5-1-3/Spoon_right.glb',
  '/models/5-1-3/Glass_Stick.glb',
  '/models/5-1-3/Tomato_wiping.glb',
  '/models/5-1-3/sugar.glb',
  '/models/5-1-3/tomato1.glb',
]
MODELS_TO_PRELOAD.forEach((path) => {
  useGLTF.preload(path)
})

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [experimentStarted, setExperimentStarted] = useState(true)
  const [showSubtitle, setShowSubtitle] = useState(false)

  const [selectedBeaker, setSelectedBeaker] = useState<'left' | 'right' | null>(null)
  const [showChoiceButtons, setShowChoiceButtons] = useState(false)

  const [resetToken, setResetToken] = useState(0)

  useEffect(() => setMounted(true), [])

  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const completionAudioRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  const [leftStickComplete, setLeftStickComplete] = useState(false)
  const [rightStickComplete, setRightStickComplete] = useState(false)

  const [showTomatoWiping, setShowTomatoWiping] = useState(false)

  const [leftTomatoExperimentDone, setLeftTomatoExperimentDone] = useState(false)
  const [rightTomatoExperimentDone, setRightTomatoExperimentDone] = useState(false)
  const [leftTomatoDropped, setLeftTomatoDropped] = useState(false)
  const [rightTomatoDropped, setRightTomatoDropped] = useState(false)
  const [tomatoWipingAnimating, setTomatoWipingAnimating] = useState(false)
  const [showCompletionPopup, setShowCompletionPopup] = useState(false)
  const [showTomatoInstruction, setShowTomatoInstruction] = useState(false)
  const [lastTomatoResult, setLastTomatoResult] = useState<'left' | 'right' | null>(null)
  const [leftChoiceUsed, setLeftChoiceUsed] = useState(false)
  const [rightChoiceUsed, setRightChoiceUsed] = useState(false)
  const [runningSide, setRunningSide] = useState<'left' | 'right' | null>(null)
  const loadingCompletedRef = useRef(false)

  const [showActivityGuide, setShowActivityGuide] = useState(false)
  const audioManager = AudioManager.getInstance()

  // 토마토 5초 타이머 관련
  const leftTomatoTimerRef = useRef<number | null>(null)
  const rightTomatoTimerRef = useRef<number | null>(null)
  const [showPickupReminder, setShowPickupReminder] = useState(false)
  const pickupReminderAudioRef = useRef<HTMLAudioElement | null>(null)

  const showResultUI = (leftTomatoExperimentDone || rightTomatoExperimentDone) && !!lastTomatoResult
  const resultDepKey = lastTomatoResult ? (lastTomatoResult === 'left' ? 'LT' : 'RT') : 'NONE'

  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const el = new Audio('/sounds/5-1-3/5-1-3-BGM.mp3')
    el.loop = true
    el.volume = 0.2
    bgmRef.current = el
    return () => {
      el.pause()
      bgmRef.current = null
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted || !bgmRef.current) return
    try {
      localStorage.setItem('bgmEnabled', JSON.stringify(bgmEnabled))
    } catch {}
    if (bgmEnabled && bgmReady) {
      bgmRef.current.play().catch(() => {})
    } else {
      bgmRef.current.pause()
    }
  }, [bgmEnabled, bgmReady, mounted])

  const toggleBgm = () => setBgmEnabled((v) => !v)

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true)
    handleResetForIntro()
    narrationRef.current?.pause()
    narrationRef.current = null
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [])

  const handleLoadingComplete = useCallback(() => {
    if (loadingCompletedRef.current) {
      return
    }
    loadingCompletedRef.current = true
    setIsLoaded(true)
  }, [])

  const handleEnterExperience = useCallback(() => {
    playClickSound()
    setBgmReady(true)
    setTimeout(() => {
      setShowIntro(false)
      setExperimentStarted(true)
      setShowSubtitle(true)

      narrationRef.current?.pause()
      const narration = new Audio('/sounds/5-1-3/narration/5-1-3-A.MP3')
      narration.volume = 0.8
      narrationRef.current = narration
      narration.play().catch(() => {})
    }, 300)
  }, [])

  // A.mp3 종료 후 버튼 표시
  useEffect(() => {
    const el = narrationRef.current
    if (!el) return
    const onEnd = () => {
      setShowSubtitle(false)
      setShowChoiceButtons(true)
    }
    el.addEventListener('ended', onEnd)
    return () => el.removeEventListener('ended', onEnd)
  }, [showIntro, experimentStarted])

  const handleNarrationComplete = useCallback(() => setShowSubtitle(false), [])

  const handleBeakerSelected = useCallback((beaker: 'left' | 'right') => {
    setSelectedBeaker(beaker)
    setShowSubtitle(true)
  }, [])

  const handleStartSugarExperiment = (side: 'left' | 'right') => {
    if (runningSide && runningSide !== side) return

    if (side === 'left' && leftChoiceUsed) return
    if (side === 'right' && rightChoiceUsed) return
    if (side === 'left') setLeftChoiceUsed(true)
    else setRightChoiceUsed(true)
    setRunningSide(side)
    ;(window as any).prepareSugarSide?.(side)
    setSelectedBeaker(null)
  }

  const handleShowActivityGuide = () => {
    audioManager.playGeneralButton()
    setShowActivityGuide(true)
  }

  const handleCloseActivityGuide = () => setShowActivityGuide(false)

  useEffect(() => {
    if (leftStickComplete && rightStickComplete) {
      setTimeout(() => {
        const audio = new Audio('/sounds/5-1-3/narration/5-1-3-C.MP3')
        audio.volume = 0.8
        audio.play().catch(() => {})
        setShowTomatoInstruction(true)
        setShowSubtitle(true)
      }, 3000)
    }
  }, [leftStickComplete, rightStickComplete])

  useEffect(() => {
    if (leftStickComplete) {
      const audio = new Audio('/sounds/5-1-3/narration/5-1-3-B.MP3')
      audio.volume = 0.8
      audio.play().catch(() => {})
    }
  }, [leftStickComplete])

  useEffect(() => {
    if (rightStickComplete) {
      const audio = new Audio('/sounds/5-1-3/narration/5-1-3-B.MP3')
      audio.volume = 0.8
      audio.play().catch(() => {})
    }
  }, [rightStickComplete])

  useEffect(() => {
    if (showCompletionPopup) {
      const audio = new Audio('/sounds/5-1-3/narration/5-1-3-G.MP3')
      audio.volume = 0.8
      completionAudioRef.current = audio
      audio.play().catch(() => {})
    } else {
      completionAudioRef.current?.pause()
      completionAudioRef.current = null
    }
  }, [showCompletionPopup])

  // showTomatoWiping이 true가 되면 타이머 정리 및 오디오 정지
  useEffect(() => {
    if (showTomatoWiping) {
      // 타이머 정리
      if (leftTomatoTimerRef.current) {
        clearTimeout(leftTomatoTimerRef.current)
        leftTomatoTimerRef.current = null
      }
      if (rightTomatoTimerRef.current) {
        clearTimeout(rightTomatoTimerRef.current)
        rightTomatoTimerRef.current = null
      }

      // 오디오 정지 및 자막 숨김
      pickupReminderAudioRef.current?.pause()
      pickupReminderAudioRef.current = null
      setShowPickupReminder(false)
    }
  }, [showTomatoWiping])

  const handleResetForIntro = useCallback(() => {
    narrationRef.current?.pause()
    narrationRef.current = null
    completionAudioRef.current?.pause()
    completionAudioRef.current = null

    // 타이머 정리
    if (leftTomatoTimerRef.current) {
      clearTimeout(leftTomatoTimerRef.current)
      leftTomatoTimerRef.current = null
    }
    if (rightTomatoTimerRef.current) {
      clearTimeout(rightTomatoTimerRef.current)
      rightTomatoTimerRef.current = null
    }
    pickupReminderAudioRef.current?.pause()
    pickupReminderAudioRef.current = null

    setShowCompletionPopup(false)
    setShowSubtitle(true)
    setSelectedBeaker(null)
    setLeftStickComplete(false)
    setRightStickComplete(false)
    setLeftTomatoExperimentDone(false)
    setRightTomatoExperimentDone(false)
    setLeftTomatoDropped(false)
    setRightTomatoDropped(false)
    setTomatoWipingAnimating(false)
    setShowTomatoInstruction(false)
    setShowChoiceButtons(false)
    setLastTomatoResult(null)
    setLeftChoiceUsed(false)
    setRightChoiceUsed(false)
    setRunningSide(null)
    setShowPickupReminder(false)

    setResetToken((t) => t + 1)
  }, [])

  const handleResetAll = useCallback(() => {
    narrationRef.current?.pause()
    narrationRef.current = null
    completionAudioRef.current?.pause()
    completionAudioRef.current = null

    // 타이머 정리
    if (leftTomatoTimerRef.current) {
      clearTimeout(leftTomatoTimerRef.current)
      leftTomatoTimerRef.current = null
    }
    if (rightTomatoTimerRef.current) {
      clearTimeout(rightTomatoTimerRef.current)
      rightTomatoTimerRef.current = null
    }
    pickupReminderAudioRef.current?.pause()
    pickupReminderAudioRef.current = null

    setShowCompletionPopup(false)
    setShowSubtitle(true)
    setSelectedBeaker(null)
    setLeftStickComplete(false)
    setRightStickComplete(false)
    setLeftTomatoExperimentDone(false)
    setRightTomatoExperimentDone(false)
    setLeftTomatoDropped(false)
    setRightTomatoDropped(false)
    setTomatoWipingAnimating(false)
    setShowTomatoInstruction(false)
    setShowChoiceButtons(false)
    setLastTomatoResult(null)
    setLeftChoiceUsed(false)
    setRightChoiceUsed(false)
    setRunningSide(null)
    setShowPickupReminder(false)

    setResetToken((t) => t + 1)

    setTimeout(() => {
      const narration = new Audio('/sounds/5-1-3/narration/5-1-3-A.MP3')
      narration.volume = 0.8
      narrationRef.current = narration
      const onEnd = () => {
        setShowSubtitle(false)
        setShowChoiceButtons(true)
        narration.removeEventListener('ended', onEnd)
      }
      narration.addEventListener('ended', onEnd)
      narration.play().catch(() => {})
    }, 300)
  }, [])

  const handleTomatoPickedUp = useCallback((beaker: 'left' | 'right') => {
    // 타이머 취소
    if (beaker === 'left' && leftTomatoTimerRef.current) {
      clearTimeout(leftTomatoTimerRef.current)
      leftTomatoTimerRef.current = null
    }
    if (beaker === 'right' && rightTomatoTimerRef.current) {
      clearTimeout(rightTomatoTimerRef.current)
      rightTomatoTimerRef.current = null
    }

    // 오디오 정지 및 자막 숨김
    pickupReminderAudioRef.current?.pause()
    pickupReminderAudioRef.current = null
    setShowPickupReminder(false)

    if (beaker === 'left') setLeftTomatoDropped(false)
    else setRightTomatoDropped(false)
    setShowTomatoWiping(true)
    setTomatoWipingAnimating(true)
  }, [])

  return (
    <div className='w-screen h-screen bg-[#999] flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      <CrayonTextButton
        ariaLabel='첫 화면으로'
        icon='home'
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={96}
        height={96}
        color='#ffffff'
        textcolor='#ffffff'
        bg={tomatoTheme.start.bg}
        className='z-[200]'
        right={120}
        top={16}
        iconSize={40}
        innerCircleVisible
      />

      <CrayonTextButton
        icon={bgmEnabled ? 'volume2' : 'volumeX'}
        position='absolute'
        iconPosition='left'
        onClick={toggleBgm}
        width={96}
        height={96}
        color='#fff'
        textcolor='#fff'
        bg={tomatoTheme.start.bg}
        className='z-[200]'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible
      />

      {!showIntro && showSubtitle && (
        <div className='fixed top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3'>
          {!leftStickComplete && !rightStickComplete && !showChoiceButtons && (
            <CrayonTextBox
              color='#01A7A2'
              bg='#FFF'
              textcolor='#333'
              padding={40}
              width={700}
              paddingY={12}
              className='font-light'
              text='같은 양의 물에 설탕의 양을 다르게 용해하여 진하기가 다른 두 용액을 만들어 보세요.'
            />
          )}
          {showTomatoInstruction && !leftTomatoExperimentDone && !rightTomatoExperimentDone && (
            <CrayonTextBox
              color='#01A7A2'
              bg='#FFF'
              textcolor='#333'
              padding={40}
              paddingY={12}
              className='font-light'
              text='용액에 방울토마토를 드래그하여 넣어보세요.'
            />
          )}
        </div>
      )}

      <AnimatePresence>
        {!showIntro && showChoiceButtons && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className='fixed top-32 left-4 z-[150]'>
            {(() => {
              const disabled = leftChoiceUsed || runningSide === 'right'
              return (
                <CrayonTextButton
                  ariaLabel='왼쪽 비커 설탕 실험'
                  position='relative'
                  text='왼쪽 비커: 설탕 한 숟가락 용해하기'
                  width={360}
                  height={72}
                  color={leftChoiceUsed ? '#64748B' : '#9ED6E9'}
                  textcolor='#fff'
                  bg={leftChoiceUsed ? 'rgba(100,116,139,0.95)' : '#009BF5'}
                  iconPosition='left'
                  iconSize={20}
                  textSize={20}
                  innerCircleVisible
                  onClick={() => {
                    if (disabled) return
                    handleStartSugarExperiment('left')
                  }}
                  aria-disabled={disabled}
                />
              )
            })()}
          </motion.div>
        )}

        {!showIntro && showChoiceButtons && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className='fixed top-32 right-4 z-[150]'>
            {(() => {
              const disabled = rightChoiceUsed || runningSide === 'left'
              return (
                <CrayonTextButton
                  ariaLabel='오른쪽 비커 설탕 실험'
                  position='relative'
                  text='오른쪽 비커: 설탕 다섯 숟가락 용해하기'
                  width={360}
                  height={72}
                  color={rightChoiceUsed ? '#64748B' : '#7BCACA'}
                  textcolor='#fff'
                  bg={rightChoiceUsed ? 'rgba(100,116,139,0.95)' : '#05A8A4'}
                  iconPosition='left'
                  iconSize={20}
                  textSize={20}
                  innerCircleVisible
                  onClick={() => {
                    if (disabled) return
                    handleStartSugarExperiment('right')
                  }}
                  aria-disabled={disabled}
                />
              )
            })()}
          </motion.div>
        )}

        {!showIntro && leftStickComplete && (
          <div className='fixed top-52 left-4 font-light z-[150]'>
            <TimedFade active showMs={2000} fadeMs={500} depKey='L'>
              <CrayonTextBox bg='#fff' color='rgba(100,116,139,0.95)' textcolor='#333' fontSize='18px'>
                설탕이 모두 용해되었어요!
              </CrayonTextBox>
            </TimedFade>
          </div>
        )}
        {!showIntro && rightStickComplete && (
          <div className='fixed top-52 right-4 font-light z-[150]'>
            <TimedFade active showMs={2000} fadeMs={500} depKey='R'>
              <CrayonTextBox bg='#fff' color='rgba(100,116,139,0.95)' textcolor='#333' fontSize='18px'>
                설탕이 모두 용해되었어요!
              </CrayonTextBox>
            </TimedFade>
          </div>
        )}

        {!showIntro && showResultUI && (
          <>
            <div className='fixed bottom-32 left-1/2 -translate-x-1/2 z-[150] font-light'>
              <TimedFade active showMs={8000} fadeMs={500} depKey={resultDepKey}>
                <CrayonTextBox bg='#fff' color={tomatoTheme.start.bg} textcolor='#333' fontSize='18px'>
                  {lastTomatoResult === 'left'
                    ? '설탕 한 숟가락을 용해한 용액에서 방울토마토가 가라앉습니다.'
                    : '설탕 다섯 숟가락을 용해한 용액에서 방울토마토가 높이 떠오릅니다.'}
                </CrayonTextBox>
              </TimedFade>
            </div>
          </>
        )}

        {/* 5초 후 리마인더 자막 */}
        {!showIntro && showPickupReminder && (
          <div className='fixed top-5 left-1/2 -translate-x-1/2 z-[150]'>
            <CrayonTextBox
              color={tomatoTheme.start.bg}
              bg='#FFF'
              textcolor='#333'
              className='font-light'
              width={400}
              padding={12}
              fontSize='18px'
              text='방울토마토를 드래그하여 꺼내보세요.'
            />
          </div>
        )}

        {leftTomatoExperimentDone && rightTomatoExperimentDone && (
          <div className='absolute bottom-8 left-1/2 -translate-x-1/2 z-[150] flex gap-4'>
            <CrayonTextButton
              ariaLabel='정리하기'
              position='relative'
              text='정리하기'
              width={160}
              height={64}
              color={tomatoTheme.start.border}
              textcolor='#fff'
              bg={tomatoTheme.start.bg}
              className='shadow-lg'
              iconPosition='left'
              iconSize={20}
              innerCircleVisible
              onClick={() => setShowCompletionPopup(true)}
            />
            <CrayonTextButton
              ariaLabel='다시 하기'
              position='relative'
              text='다시 하기'
              width={160}
              height={64}
              color='#ffffff20'
              textcolor='#fff'
              bg='#64748B'
              className='shadow-lg'
              iconPosition='left'
              iconSize={20}
              innerCircleVisible
              onClick={handleResetAll}
            />
          </div>
        )}
      </AnimatePresence>

      {!showIntro && showCompletionPopup && (
        <div className='fixed inset-0 bg-black/50 z-[300] flex text-center items-center justify-center'>
          <div className='bg-white rounded-2xl p-8 shadow-2xl max-w-md'>
            <h3 className='text-2xl font-bold text-gray-800 mb-4'>실험 완료</h3>
            <p className='text-lg text-gray-700 font-light mb-6 leading-relaxed'>
              같은 물체를 넣었을 때 물체가 높이 떠오른 용액이
              <br />더 진한 용액입니다.
            </p>
            <CrayonTextButton
              onClick={() => setShowCompletionPopup(false)}
              color={tomatoTheme.start.border}
              textcolor='#fff'
              bg={tomatoTheme.start.bg}
              text='확인'
            />
          </div>
        </div>
      )}

      <Scene shadows camera={{ position: CAMERA_CONFIG.position, fov: CAMERA_CONFIG.fov }}>
        <group scale={2}></group>
        <TiltOnMouse enabled={showIntro} maxDeg={5}>
          <ExperimentScene
            experimentStarted={experimentStarted}
            onNarrationComplete={handleNarrationComplete}
            onBeakerSelected={handleBeakerSelected}
            showTomatoWiping={showTomatoWiping}
            setShowTomatoWiping={setShowTomatoWiping}
            onStickComplete={(side) => {
              if (side === 'left') setLeftStickComplete(true)
              else setRightStickComplete(true)
              setRunningSide((curr) => (curr === side ? null : curr))
            }}
            onTomatoPickedUp={handleTomatoPickedUp}
            onTomatoExperimentComplete={(side) => {
              if (side === 'left') {
                setLastTomatoResult('left')
                const a = new Audio('/sounds/5-1-3/narration/5-1-3-D.MP3')
                a.volume = 0.8
                a.play().catch(() => {})
                setLeftTomatoExperimentDone(true)

                // 5초 타이머 시작
                leftTomatoTimerRef.current = window.setTimeout(() => {
                  const f = new Audio('/sounds/5-1-3/narration/5-1-3-F.MP3')
                  f.volume = 0.8
                  pickupReminderAudioRef.current = f
                  f.play().catch(() => {})
                  setShowPickupReminder(true)
                }, 5000)
              } else {
                setLastTomatoResult('right')
                const a = new Audio('/sounds/5-1-3/narration/5-1-3-E.MP3')
                a.volume = 0.8
                a.play().catch(() => {})
                setRightTomatoExperimentDone(true)

                // 5초 타이머 시작
                rightTomatoTimerRef.current = window.setTimeout(() => {
                  const f = new Audio('/sounds/5-1-3/narration/5-1-3-F.MP3')
                  f.volume = 0.8
                  pickupReminderAudioRef.current = f
                  f.play().catch(() => {})
                  setShowPickupReminder(true)
                }, 5000)
              }
            }}
            resetToken={resetToken}
          />
        </TiltOnMouse>
      </Scene>

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='진하기가 다른 두 용액에서 같은 물체가 뜨는 정도 관찰하기'
          description={[
            '색깔로 진하기를 알 수 없는 두 용액에 같은 물체를 넣어 용액의 상대적인 진하기를 비교해 봅시다.',
          ]}
          backgroundSvg='/img/cover/5-1-3.svg'
          buttonTheme={tomatoTheme}
          onActivityGuide={handleShowActivityGuide}
          descriptionSound='/sounds/5-1-3/narration/5-1-3-Goal.MP3'
        />
      )}
      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}
