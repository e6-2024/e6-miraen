import { useState, useRef, useEffect, useCallback } from 'react'
import { Physics } from '@react-three/cannon'
import { useProgress, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { AnimatePresence, motion } from 'framer-motion'
import Scene from '@/components/canvas/Scene'
import SieveSimulation from '@/scenes/SieveSimulation'
import Intro from '@/components/intro/Intro'
import { Environment, OrbitControls } from '@react-three/drei'
import { playSound, playNarration, stopNarration, stopSound } from '@/utils/5-2-1/audioManger'
import { BACKGROUND_MUSIC, NARRATIONS, SOUND_EFFECTS, VOLUMES } from '@/utils/5-2-1/narratonConfig'
import { SIEVE_CONFIG, PHYSICS_CONFIG } from '@/utils/5-2-1/sieveConfig'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { TiltOnMouse } from '@/components/common/Tilt'
import ActivityGuideModal from '@/components/5-2-1/ActivityGuideModal'
import AudioManager from '@/components/5-2-1/AudioManager'

type ButtonStyle = { bg: string; border: string; text: string }

type ParticleTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}

const particleTheme: ParticleTheme = {
  goal: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
  guide: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
  start: { bg: '#01A7A2', border: '#78C9C9', text: '#FFFFFF' },
}

function SievePreview({ level }: { level: number }) {
  const { scene } = useGLTF('/models/5-2-1/Strainers.gltf')
  const mesh = scene.children[level]?.clone()

  return (
    <div className='mb-4'>
      <Scene camera={{ position: [0, 2, 4], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[2, 2, 2]} intensity={0.6} />
        <Environment preset='warehouse' backgroundIntensity={0.1} />
        {mesh && (
          <primitive object={mesh} position={[0, -0.5, -0.5]} scale={0.2} rotation={[-1, 3.1, 0]} bn={[0.4, 0.1, 0]} />
        )}
        <OrbitControls enablePan={false} enableZoom={false} />
      </Scene>
    </div>
  )
}

function ParticlePreview({ radius, color }: { radius: number; color: string }) {
  return (
    <div className='mx-auto w-24 h-32'>
      <Scene camera={{ position: [0, 0, 3.4], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <Environment preset='warehouse' backgroundIntensity={0.1} />
        <mesh castShadow>
          <sphereGeometry args={[radius, 16, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={4} />
      </Scene>
    </div>
  )
}

function SieveSelectionPage({ onSelectSieve }: { onSelectSieve: (selectedLevel: number) => void }) {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedSieve, setSelectedSieve] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    playNarration(NARRATIONS.INTRO, VOLUMES.NARRATION)
  }, [])

  const handleSieveSelect = (level: number) => {
    setSelectedSieve(level)
  }

  const handleStartExperiment = () => {
    if (selectedSieve !== null) {
      playSound(SOUND_EFFECTS.CLICK, VOLUMES.SOUND_EFFECT)
      setIsVisible(false)
      setTimeout(() => onSelectSieve(selectedSieve), 300)
    }
  }

  return (
    <div className='fixed inset-0 bg-[#78C9C9] flex items-center justify-center z-30'>
      <CrayonTextBox color='#374151' bg='#e5e5e5' padding={32} paddingY={32} animated={true}>
        <h1 className='text-2xl font-bold text-black mb-2'>
          구슬과 체의 눈 크기를 비교한 뒤, 눈의 크기가 알맞은 체를 골라 구슬 혼합물을 분리해 보세요.
        </h1>

        <div className='flex justify-center pb-10 items-center'>
          <div className='text-center font-light'>
            <ParticlePreview radius={0.3} color='orange' />
            <p className='text-sm font-medium text-gray-700'>큰 구슬</p>
          </div>
          <div className='text-center font-light'>
            <ParticlePreview radius={0.15} color='limegreen' />
            <p className='text-sm font-medium text-gray-700'>작은 구슬</p>
          </div>
        </div>

        <div className='flex gap-3'>
          {SIEVE_CONFIG.LEVELS.map((sieve) => (
            <div
              key={sieve.level}
              className={`cursor-pointer border-4 border-black rounded-xl p-4 transform ${
                selectedSieve === sieve.level ? 'bg-white' : 'bg-[#e5e5e5]'
              }`}
              onClick={() => handleSieveSelect(sieve.level)}>
              <div className={`rounded-xl h-full w-full`}>
                <div className='text-center mb-4'>
                  <h3 className='font-bold text-gray-800 mb-4'>{sieve.title}</h3>
                  <div className={selectedSieve === sieve.level ? 'bg-white' : 'bg-[#e5e5e5]'}>
                    <SievePreview level={sieve.level} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <CrayonTextButton
          text={selectedSieve !== null ? '선택한 체로 실험하기' : '체를 선택해 주세요.'}
          bg={selectedSieve !== null ? particleTheme.start.bg : '#666'}
          color={'#fff'}
          textcolor={'#fff'}
          width={290}
          className='mt-6'
          onClick={handleStartExperiment}
        />
      </CrayonTextBox>
    </div>
  )
}

function SummaryPopup({ onClose }: { onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    playNarration(NARRATIONS.SUMMARY, VOLUMES.NARRATION)
    return () => {
      clearTimeout(timer)
      stopNarration()
    }
  }, [])

  const handleClose = () => {
    stopNarration()
    playSound(SOUND_EFFECTS.BUTTON, VOLUMES.SOUND_EFFECT)
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key='summary-overlay'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={handleClose}>
          <motion.div
            key='summary-content'
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={(e) => e.stopPropagation()}>
            <CrayonTextBox color='#374151' bg='#fff' width={720} padding={32} paddingY={32} animated={true}>
              <h2 className='text-2xl font-bold mb-8 text-center text-gray-800'>실험 정리</h2>

              <div className='space-y-8 text-left text-gray-700'>
                <div className='flex items-start space-x-2'>
                  <span className='font-light'>•</span>
                  <p className='text-s font-light'>
                    알갱이의 크기가 다른 고체 혼합물은 알갱이의 크기 차이를 이용해 체로 분리할 수 있습니다.
                  </p>
                </div>
                <div className='flex items-start space-x-2'>
                  <span className='font-light'>•</span>
                  <p className='text-s font-light'>
                    체를 사용할 때에는 알갱이의 크기와 체의 눈 크기를 비교해 알맞은 것을 골라야 합니다.
                  </p>
                </div>
              </div>

              <div className='mt-8 flex justify-center'>
                <CrayonTextButton onClick={handleClose} text='확인' bg='#444' color='#fff' textcolor='#fff' />
              </div>
            </CrayonTextBox>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function NarrationText({ level, onClose }: { level: number; onClose: () => void }) {
  const DUR: Record<number, number> = {
    0: 10000,
    1: 10000,
    2: 4000,
  }
  const messages: Record<number, string> = {
    0: '구슬 혼합물이 분리되지 않았어요. 다른 체를 사용해 구슬 혼합물을 분리해 보세요.',
    1: '구슬 혼합물이 분리되지 않았어요. 다른 체를 사용해 구슬 혼합물을 분리해 보세요.',
    2: '구슬 혼합물이 분리되었어요.',
  }

  useEffect(() => {
    const t = setTimeout(onClose, DUR[level] ?? 6000)
    return () => clearTimeout(t)
  }, [level, onClose])

  return (
    <div className='fixed inset-0 flex items-center justify-center z-50' onClick={onClose}>
      <CrayonTextBox color='#444' bg='#fff' padding={40} paddingY={12} animated={true}>
        <p className='text-3xl font-bold text-gray-800'>{messages[level] ?? messages[0]}</p>
      </CrayonTextBox>
    </div>
  )
}

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

function ShadowLighting() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={3}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </>
  )
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const [triggerSpawn, setTriggerSpawn] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(0)
  const [gravity, setGravity] = useState<[number, number, number]>(PHYSICS_CONFIG.gravity)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showSieveSelection, setShowSieveSelection] = useState(false)
  const [physicsKey, setPhysicsKey] = useState(0)
  const [showSummaryButton, setShowSummaryButton] = useState(false)
  const [showSummaryPopup, setShowSummaryPopup] = useState(false)

  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  const [showNarrationOverlay, setShowNarrationOverlay] = useState(false)
  const [overlayLevel, setOverlayLevel] = useState<number | null>(null)
  const [hasSpawned, setHasSpawned] = useState(false)
  const [highlightSpawn, setHighlightSpawn] = useState(false)
  const [showActivityGuide, setShowActivityGuide] = useState(false)
  const audioManager = AudioManager.getInstance()

  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const el = new Audio('/sounds/5-2-1/5-2-1-BGM.mp3')
    el.loop = true
    el.volume = 0.1
    bgmRef.current = el
    return () => {
      el.pause()
      bgmRef.current = null
    }
  }, [mounted])

  // 상태 반영 (재생/일시정지 + 저장)
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

  const handleSpawn = () => {
    setHighlightSpawn(false)
    setHasSpawned(true)
    setTriggerSpawn(true)
    setTimeout(() => {
      playSound(SOUND_EFFECTS.BALL_SOUND, VOLUMES.BALL_SOUND)
    }, 1000)

    const showOverlayWithNarration = (delayMs: number) => {
      setTimeout(() => {
        setOverlayLevel(selectedLevel)
        setShowNarrationOverlay(true)
        playNarration(NARRATIONS.BALL_DROP, VOLUMES.NARRATION)
        setTimeout(() => setShowNarrationOverlay(false), 10000)
      }, delayMs)
    }
    if (selectedLevel === 0) {
      showOverlayWithNarration(5000)
    }

    if (selectedLevel === 1) {
      showOverlayWithNarration(5000)
    }
  }

  const handleSpawnHandled = () => {
    setTriggerSpawn(false)
  }

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const handleBackToIntro = () => {
    stopNarration()
    stopSound()
    audioManager.stopCurrentAudio()

    setShowIntro(true)
    setShowSieveSelection(false)
    handleReset()
  }

  const handleEnterExperience = () => {
    playSound(SOUND_EFFECTS.CLICK, VOLUMES.SOUND_EFFECT)
    setShowIntro(false)
    setShowSieveSelection(true)
    setBgmReady(true)
    setTimeout(() => {
      playNarration(NARRATIONS.EXPERIMENT_START, VOLUMES.NARRATION)
    }, 1000)
  }

  const handleSelectSieve = (selectedLevel: number) => {
    setSelectedLevel(selectedLevel)
    setShowSieveSelection(false)
    setHighlightSpawn(true)
    setTimeout(() => setHighlightSpawn(false), 8000)
  }

  const handleReset = () => {
    stopNarration()
    stopSound()
    audioManager.stopCurrentAudio()
    setShowNarrationOverlay(false)
    setOverlayLevel(null)
    setHasSpawned(false)
    setGravity(PHYSICS_CONFIG.gravity)
    setPhysicsKey((prev) => prev + 1)
    setShowSummaryButton(false)
  }
  
  const handleLevelChange = (level: number) => {
    stopNarration()
    stopSound()
    audioManager.stopCurrentAudio()
    setShowNarrationOverlay(false)
    setOverlayLevel(null)
    setHasSpawned(false)
    setSelectedLevel(level)
    setPhysicsKey((prev) => prev + 1)
    setShowSummaryButton(false)
  }

  const handleSeparationComplete = () => {
    if (selectedLevel === 2) {
      setShowSummaryButton(true)
      setShowNarrationOverlay(true)
      setOverlayLevel(2)
      playNarration(NARRATIONS.SEPARATION_COMPLETE, VOLUMES.NARRATION)
    }
  }

  const handleSummaryClick = () => {
    playSound(SOUND_EFFECTS.CLICK, VOLUMES.SOUND_EFFECT)
    setShowSummaryPopup(true)
  }

  const handleCloseSummaryPopup = () => {
    setShowSummaryPopup(false)
  }

  const handleShowActivityGuide = () => {
    audioManager.playGeneralButton()
    setShowActivityGuide(true)
  }

  const handleCloseActivityGuide = () => setShowActivityGuide(false)

  return (
    <div className='w-screen h-screen bg-[#D5E8E8] relative flex flex-col overflow-hidden '>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />
      <div className={`flex-1 ${showSieveSelection ? 'invisible' : 'visible'}`}>
        <Scene
          shadows
          camera={{ position: [10, 14, 10], fov: 50 }}
          gl={{
            shadowMap: {
              enabled: true,
              type: THREE.PCFSoftShadowMap,
            },
          }}>
          <TiltOnMouse enabled={showIntro} maxDeg={10} position={[0, 0, 0]}>
            <ShadowLighting />

            <Physics
              key={physicsKey}
              gravity={gravity}
              allowSleep={true}
              iterations={15}
              defaultContactMaterial={{
                friction: PHYSICS_CONFIG.friction,
                restitution: PHYSICS_CONFIG.restitution,
              }}
              tolerance={0.001}>
              <SieveSimulation
                triggerSpawn={triggerSpawn}
                onSpawnHandled={handleSpawnHandled}
                selectedLevel={selectedLevel}
                setGravity={setGravity}
                onSeparationComplete={handleSeparationComplete}
              />
            </Physics>
          </TiltOnMouse>

          <Environment preset='warehouse' backgroundIntensity={0.1} />
          <OrbitControls minDistance={1} maxDistance={15} />
        </Scene>
      </div>

      {showNarrationOverlay && overlayLevel !== null && (
        <NarrationText level={overlayLevel} onClose={() => setShowNarrationOverlay(false)} />
      )}

      {!showIntro && !showSieveSelection && (
        <>
          <div className='fixed top-4 left-4 flex flex-col gap-0'>
            {[0, 2, 1].map((level) => (
              <CrayonTextButton
                key={level}
                width={590}
                color={selectedLevel === level ? '#000' : '#444'}
                textcolor={selectedLevel === level ? '#000' : '#444'}
                icon={selectedLevel === level ? 'arrow-right' : undefined}
                iconSize={30}
                iconPosition='left'
                bg={selectedLevel === level ? '#fff' : '#e5e5e5'}
                text={SIEVE_CONFIG.LEVELS.find((s) => s.level === level)?.title || ''}
                onClick={() => {
                  playSound(SOUND_EFFECTS.BUTTON, VOLUMES.SOUND_EFFECT)
                  handleLevelChange(level)
                }}
              />
            ))}
          </div>

          <div className='flex flex-col fixed bottom-4 right-4 z-10'>
            <CrayonTextButton
              color='#01A7A2'
              bg='#78C9C9'
              textcolor='#333'
              icon={hasSpawned ? 'refresh' : 'plus'}
              iconSize={30}
              width={hasSpawned ? 210 : 290}
              iconPosition='left'
              text={hasSpawned ? '다시 하기' : '구슬 혼합물 넣기'}
              className={highlightSpawn ? 'animate-pulse' : ''}
              onClick={() => {
                playSound(SOUND_EFFECTS.BUTTON, VOLUMES.SOUND_EFFECT)
                if (hasSpawned) {
                  handleReset()
                } else {
                  handleSpawn()
                }
              }}
            />

            {showSummaryButton && (
              <CrayonTextButton
                bg='#DFB2FA'
                color='#9B1CDF'
                icon={'PencilLine'}
                textcolor='#333'
                iconSize={30}
                iconPosition='left'
                onClick={handleSummaryClick}
                text='정리하기'
              />
            )}
          </div>
        </>
      )}

      {isLoaded && showIntro && (
        <div className='absolute inset-0'>
          <Intro
            onEnter={handleEnterExperience}
            title='크기가 다른 구슬 혼합물 분리하기'
            description={['알갱이의 크기가 다른 고체 혼합물은 어떻게 분리할 수 있는지 알아봅시다.']}
            backgroundSvg='/img/cover/5-2-1.svg'
            onActivityGuide={handleShowActivityGuide}
            descriptionSound={NARRATIONS.GOAL}
            buttonTheme={particleTheme}
          />
        </div>
      )}

      {showSieveSelection && <SieveSelectionPage onSelectSieve={handleSelectSieve} />}

      {showSummaryPopup && <SummaryPopup onClose={handleCloseSummaryPopup} />}
      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />

      <CrayonTextButton
        icon={bgmEnabled ? 'volume2' : 'volumeX'}
        position='absolute'
        iconPosition='left'
        onClick={toggleBgm}
        width={96}
        height={96}
        color='#ffffff'
        textcolor='#ffffff'
        bg={particleTheme.start.bg}
        right={16}
        top={16}
        className='z-30'
        innerCircleVisible={true}
        iconSize={40}
      />
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
        bg={particleTheme.start.bg}
        right={120}
        top={16}
        iconSize={40}
        className='z-30'
        innerCircleVisible={true}
      />
    </div>
  )
}
