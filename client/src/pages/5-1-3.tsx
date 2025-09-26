// app/5-1-3/page.tsx
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

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [experimentStarted, setExperimentStarted] = useState(true)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [selectedBeaker, setSelectedBeaker] = useState<'left' | 'right' | null>(null)

  useEffect(() => setMounted(true), [])

  // Audio
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const narrationRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

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
    if (narrationRef.current) {
      narrationRef.current.pause()
      narrationRef.current = null
    }
    setShowIntro(true)
    setExperimentStarted(false)
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

      // 기존 내레이션 정리
      narrationRef.current?.pause()

      // 내레이션 설정
      const narration = new Audio('/sounds/5-1-3/narration/5-1-3-A.MP3')
      narration.volume = 0.8
      narrationRef.current = narration
      narration.play().catch(() => {})
    }, 300)
  }, [])

  // 내레이션 종료 시 자막 끄기 (정합성 ↑)
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

  // 설탕 실험 시작 핸들러
  const handleStartSugarExperiment = (side: 'left' | 'right') => {
    if (side === 'left') {
      ;(window as any).startLeftSugarExperiment?.()
    } else {
      ;(window as any).startRightSugarExperiment?.()
    }
  }

  return (
    <div className='w-screen h-screen bg-[#999] flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      {/* 홈 */}
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

      {/* BGM */}
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

      {selectedBeaker && (
        <div
          className={`absolute bottom-4 z-10 ${
            selectedBeaker === 'left' ? 'left-4' : 'right-4'
          } bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200 w-64`}>
          <h3 className={`text-lg font-bold ${selectedBeaker === 'left' ? 'text-blue-800' : 'text-green-800'} mb-3`}>
            {selectedBeaker === 'left' ? '왼쪽 비커' : '오른쪽 비커'}
          </h3>

          <div className={`mb-3 p-3 ${selectedBeaker === 'left' ? 'bg-blue-100' : 'bg-green-100'} rounded-lg`}>
            <div className={`text-sm ${selectedBeaker === 'left' ? 'text-blue-700' : 'text-green-700'} font-light`}>
              투입량: <span className='font-bold'>{selectedBeaker === 'left' ? '1스푼' : '5스푼'}</span>
            </div>
          </div>

          <button
            onClick={() => handleStartSugarExperiment(selectedBeaker)}
            className={`w-full px-4 py-3 ${
              selectedBeaker === 'left' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'
            } text-white rounded-lg font-light transition-colors text-sm`}>
            🥄 설탕 넣기 시작
          </button>

          <button
            onClick={() => setSelectedBeaker(null)}
            className='w-full mt-2 px-4 py-2 bg-gray-500 text-white rounded-lg font-light hover:bg-gray-600 transition-colors text-sm'>
            선택 해제
          </button>
        </div>
      )}

      {showSubtitle && (
        <div className='fixed top-5 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3'>
          {selectedBeaker === null && (
            <CrayonTextBox color='#01A7A2' bg='#FFF' textcolor='#333' className='font-light'>
              <p>같은 양의 물에 설탕의 양을 다르게 용해하여 진하기가 다른 두 용액을 만들어 보세요.</p>
            </CrayonTextBox>
          )}

          {selectedBeaker !== null && (
            <CrayonTextButton
              ariaLabel='선택된 비커 안내'
              position='relative'
              text={
                selectedBeaker === 'left'
                  ? '왼쪽 비커: 설탕 한 숟가락 용해하기'
                  : '오른쪽 비커: 설탕 다섯 숟가락 용해하기'
              }
              width={360}
              height={72}
              color='#01A7A2'
              textcolor='#fff'
              bg='rgba(1,167,162,0.85)'
              className='shadow-lg'
              iconPosition='left'
              iconSize={20}
              innerCircleVisible={true}
            />
          )}
        </div>
      )}

      {/* Canvas */}
      <Scene shadows camera={{ position: CAMERA_CONFIG.position, fov: CAMERA_CONFIG.fov }}>
        <TiltOnMouse enabled={showIntro} maxDeg={5}>
          <ExperimentScene
            experimentStarted={experimentStarted}
            onNarrationComplete={handleNarrationComplete}
            onBeakerSelected={handleBeakerSelected}
          />
        </TiltOnMouse>
      </Scene>

      {/* Intro */}
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
