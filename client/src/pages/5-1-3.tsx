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

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [experimentStarted, setExperimentStarted] = useState(true)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [selectedBeaker, setSelectedBeaker] = useState<'left' | 'right' | null>(null)

  // ★ 자식에게 리셋 신호를 보내는 토큰
  const [resetToken, setResetToken] = useState(0)

  useEffect(() => setMounted(true), [])

  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const completionAudioRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  const [leftStickComplete, setLeftStickComplete] = useState(false)
  const [rightStickComplete, setRightStickComplete] = useState(false)
  const [leftTomatoExperimentDone, setLeftTomatoExperimentDone] = useState(false)
  const [rightTomatoExperimentDone, setRightTomatoExperimentDone] = useState(false)
  const [showCompletionPopup, setShowCompletionPopup] = useState(false)
  const [showTomatoInstruction, setShowTomatoInstruction] = useState(false)

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
    narrationRef.current?.pause()
    narrationRef.current = null
    setShowIntro(true)
    setExperimentStarted(true)
    setShowSubtitle(false)
    setSelectedBeaker(null)
    playClickSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [])

  const handleLoadingComplete = useCallback(() => {
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

  useEffect(() => {
    const el = narrationRef.current
    if (!el) return
    const onEnd = () => setShowSubtitle(false)
    el.addEventListener('ended', onEnd)
    return () => el.removeEventListener('ended', onEnd)
  }, [showIntro, experimentStarted])

  const handleNarrationComplete = useCallback(() => {
    setShowSubtitle(false)
  }, [])

  const handleBeakerSelected = useCallback((beaker: 'left' | 'right') => {
    setSelectedBeaker(beaker)
    setShowSubtitle(true)
  }, [])

  const handleStartSugarExperiment = (side: 'left' | 'right') => {
    if (side === 'left') {
      ;(window as any).startLeftSugarExperiment?.()
    } else {
      ;(window as any).startRightSugarExperiment?.()
    }
    setSelectedBeaker(null)
  }

  useEffect(() => {
    if (leftStickComplete && rightStickComplete) {
      setTimeout(() => {
        const audio = new Audio('/sounds/5-1-3/narration/5-1-3-C.MP3')
        audio.volume = 0.8
        audio.play().catch(() => {})

        setShowTomatoInstruction(true)
        setShowSubtitle(true)
      }, 2000)
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

  // ★ 전체 상태 초기화: 페이지 리로드 없이 다시하기
  const handleResetAll = useCallback(() => {
    narrationRef.current?.pause()
    narrationRef.current = null
    completionAudioRef.current?.pause()
    completionAudioRef.current = null

    setShowCompletionPopup(false)
    setShowSubtitle(true)
    setSelectedBeaker(null)
    setLeftStickComplete(false)
    setRightStickComplete(false)
    setLeftTomatoExperimentDone(false)
    setRightTomatoExperimentDone(false)
    setShowTomatoInstruction(false)

    // 자식에게 리셋 신호
    setResetToken((t) => t + 1)
  }, [])

  return (
    <div className='w-screen h-screen bg-[#999] flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      <CrayonTextButton
        ariaLabel={'첫 화면으로'}
        icon={'home'}
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={96}
        height={96}
        color='#ffffff'
        textcolor='#ffffff'
        bg='rgba(255,255,255,0.10)'
        className='background-blur z-[200] mix-blend-difference'
        right={120}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
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
        bg='rgba(255,255,255,0.10)'
        className='backdrop-blur z-[200] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {showSubtitle && (
        <div className='fixed top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3'>
          {selectedBeaker === null && !leftStickComplete && !rightStickComplete && (
            <CrayonTextBox
              color='#01A7A2'
              bg='#FFF'
              textcolor='#333'
              className='font-light'
              width={400}
              text='같은 양의 물에 설탕의 양을 다르게 용해하여 진하기가 다른 두 용액을 만들어 보세요.'></CrayonTextBox>
          )}

          {showTomatoInstruction && !leftTomatoExperimentDone && !rightTomatoExperimentDone && (
            <CrayonTextBox
              color='#01A7A2'
              bg='#FFF'
              textcolor='#333'
              className='font-light'
              width={600}
              text='용액에 방울 토마토를 드래그하여 넣어보세요.'></CrayonTextBox>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedBeaker === 'left' && !leftStickComplete && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className='fixed top-32 left-8 z-[150]'>
            <CrayonTextButton
              ariaLabel='왼쪽 비커 설탕 실험'
              position='relative'
              text='왼쪽 비커: 설탕 한 숟가락 용해하기'
              width={320}
              height={72}
              color='#0EA5E9'
              textcolor='#fff'
              bg='rgba(14,165,233,0.95)'
              className='shadow-lg'
              iconPosition='left'
              iconSize={20}
              innerCircleVisible={true}
              onClick={() => handleStartSugarExperiment('left')}
            />
          </motion.div>
        )}

        {selectedBeaker === 'right' && !rightStickComplete && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className='fixed top-32 right-8 z-[150]'>
            <CrayonTextButton
              ariaLabel='오른쪽 비커 설탕 실험'
              position='relative'
              text='오른쪽 비커: 설탕 다섯 숟가락 용해하기'
              width={340}
              height={72}
              color='#10B981'
              textcolor='#fff'
              bg='rgba(16,185,129,0.95)'
              className='shadow-lg'
              iconPosition='left'
              iconSize={20}
              innerCircleVisible={true}
              onClick={() => handleStartSugarExperiment('right')}
            />
          </motion.div>
        )}

        {leftStickComplete && (
          <div className='fixed top-48 left-48 font-light z-[150]'>
            <TimedFade active={true} showMs={2000} fadeMs={500} depKey={leftStickComplete ? 'L1' : 'L0'}>
              <CrayonTextBox bg='#fff' color='#10B981' textcolor='#333' fontSize='16px'>
                설탕이 모두 용해되었어요!
              </CrayonTextBox>
            </TimedFade>
          </div>
        )}

        {rightStickComplete && (
          <div className='fixed top-48 right-48 font-light z-[150]'>
            <TimedFade active={true} showMs={2000} fadeMs={500} depKey={leftStickComplete ? 'L1' : 'L0'}>
              <CrayonTextBox bg='#fff' color='#10B981' textcolor='#333' fontSize='16px'>
                설탕이 모두 용해되었어요!
              </CrayonTextBox>
            </TimedFade>
          </div>
        )}

        {leftTomatoExperimentDone && (
          <div className='fixed bottom-24 left-8 z-[150] font-light'>
            <TimedFade active={true} showMs={8000} fadeMs={500} depKey={leftStickComplete ? 'L1' : 'L0'}>
              <CrayonTextBox bg='#fff' color='#10B981' textcolor='#333' fontSize='16px'>
                설탕 한 숟가락을 용해한 용액에서 방울토마토가 가라앉습니다.
              </CrayonTextBox>
            </TimedFade>
          </div>
        )}

        {rightTomatoExperimentDone && (
          <div className='fixed bottom-24 right-8 z-[150] font-light'>
            <TimedFade active={true} showMs={8000} fadeMs={500} depKey={leftStickComplete ? 'L1' : 'L0'}>
              <CrayonTextBox bg='#fff' color='#10B981' textcolor='#333' fontSize='16px'>
                설탕 다섯 숟가락을 용해한 용액에서 방울토마토가 높이 떠오릅니다.
              </CrayonTextBox>
            </TimedFade>
          </div>
        )}

        {(leftTomatoExperimentDone || rightTomatoExperimentDone) && (
            <div className='fixed top-5 left-1/2 -translate-x-1/2 z-[150]'>
              <CrayonTextBox
                color='#8B5CF6'
                bg='#FFF'
                textcolor='#333'
                className='font-light'
                width={400}
                text='방울토마토를 드래그하여 꺼내보세요.'></CrayonTextBox>
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
              color='#8B5CF6'
              textcolor='#fff'
              bg='rgba(139,92,246,0.95)'
              className='shadow-lg'
              iconPosition='left'
              iconSize={20}
              innerCircleVisible={true}
              onClick={() => setShowCompletionPopup(true)}
            />
            <CrayonTextButton
              ariaLabel='다시하기'
              position='relative'
              text='다시하기'
              width={160}
              height={64}
              color='#64748B'
              textcolor='#fff'
              bg='rgba(100,116,139,0.95)'
              className='shadow-lg'
              iconPosition='left'
              iconSize={20}
              innerCircleVisible={true}
              onClick={handleResetAll} // ★ 변경
            />
          </div>
        )}
      </AnimatePresence>

      {showCompletionPopup && (
        <div className='fixed inset-0 bg-black/50 z-[300] flex text-center items-center justify-center'>
          <div className='bg-white rounded-2xl p-8 shadow-2xl max-w-md'>
            <h3 className='text-2xl font-bold text-gray-800 mb-4'>실험 완료</h3>
            <p className='text-lg text-gray-700 font-light mb-6 leading-relaxed'>
              같은 물체를 넣었을 때 물체가 높이 떠오른 용액이
              <br /> 더 진한 용액입니다.
            </p>
            <CrayonTextButton
              onClick={() => setShowCompletionPopup(false)}
              bg='#0EA5E9'
              color='rgba(118, 234, 255, 1)'
              text='확인'
            />
          </div>
        </div>
      )}

      <Scene shadows camera={{ position: CAMERA_CONFIG.position, fov: CAMERA_CONFIG.fov }}>
        <TiltOnMouse enabled={showIntro} maxDeg={5}>
          <ExperimentScene
            experimentStarted={experimentStarted}
            onNarrationComplete={handleNarrationComplete}
            onBeakerSelected={handleBeakerSelected}
            onStickComplete={(side) => {
              if (side === 'left') setLeftStickComplete(true)
              else setRightStickComplete(true)
            }}
            onTomatoExperimentComplete={(side) => {
              if (side === 'left') {
                setLeftTomatoExperimentDone(true)
                const audio = new Audio('/sounds/5-1-3/narration/5-1-3-D.MP3')
                audio.volume = 0.8
                audio.play().catch(() => {})
                setTimeout(() => {
                  const audioF = new Audio('/sounds/5-1-3/narration/5-1-3-F.MP3')
                  audioF.volume = 0.8
                  audioF.play().catch(() => {})
                }, 7000)
              } else {
                setRightTomatoExperimentDone(true)
                const audio = new Audio('/sounds/5-1-3/narration/5-1-3-E.MP3')
                audio.volume = 0.8
                audio.play().catch(() => {})
                setTimeout(() => {
                  const audioF = new Audio('/sounds/5-1-3/narration/5-1-3-F.MP3')
                  audioF.volume = 0.8
                  audioF.play().catch(() => {})
                }, 7000)
              }
            }}
            resetToken={resetToken} // ★ 추가
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
          descriptionSound='/sounds/5-1-3/narration/5-1-3-Goal.MP3'
        />
      )}
    </div>
  )
}
