import { useThree } from '@react-three/fiber'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Environment, useProgress, OrbitControls, Sky, Cloud, Clouds } from '@react-three/drei'
import * as THREE from 'three'

import { Model } from '../components/6-1-3/Model'
import { SpeechBubble } from '../components/6-1-3/SpeechBubble'
import { RootWaterAbsorption, LeafEvaporation } from '../components/6-1-3/WaterFlowEffects'
import { SubtitleBox, WaterFlowButton, ViewControls, LeafAnimation, FullscreenEvaporation } from '../components/6-1-3/PlantUI'
import Scene from '../components/canvas/Scene'
import Intro from '../components/intro/Intro'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { TiltOnMouse } from '@/components/common/Tilt'
import { usePlantAudio } from '@/hook/6-1-3/useAudio'
import { CAMERA_CONFIGS, getNarrationTexts, ViewType, InfoPanelType } from '@/utils/6-1-3/utils'
import ActivityGuideModal from '@/components/6-1-3/ActivityGuideModal'
import AudioManager from '@/components/6-1-3/AudioManager'

type ButtonStyle = { bg: string; border: string; text: string }

type RoomTheme = {
  goal: ButtonStyle
  guide: ButtonStyle
  start: ButtonStyle
}

const roomTheme: RoomTheme = {
  goal: { bg: '#05A8A4', border: '#7BCACA', text: '#FFFFFF' },
  guide: { bg: '#05A8A4', border: '#7BCACA', text: '#FFFFFF' },
  start: { bg: '#9B1CDF', border: '#DFB2FA', text: '#FFFFFF' },
}
const audioManager = AudioManager.getInstance()

function RootMarker({ position }: { position: THREE.Vector3 }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.05, 16, 16]} />
      <meshBasicMaterial color='red' transparent opacity={0.6} />
    </mesh>
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

function ViewBasedControls({
  currentView,
  orbitControlsRef,
}: {
  currentView: ViewType
  orbitControlsRef: React.RefObject<any>
}) {
  const { camera } = useThree()
  const currentConfig = CAMERA_CONFIGS[currentView]

  useEffect(() => {
    const newPosition = new THREE.Vector3(...currentConfig.position)
    camera.position.copy(newPosition)
    camera.lookAt(new THREE.Vector3(...currentConfig.target))
    camera.updateProjectionMatrix()
  }, [currentView, camera, currentConfig])

  return (
    <OrbitControls
      ref={orbitControlsRef}
      target={currentConfig.target}
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      minDistance={currentConfig.minDistance}
      maxDistance={currentConfig.maxDistance}
      minPolarAngle={currentConfig.minPolarAngle}
      maxPolarAngle={currentConfig.maxPolarAngle}
      minAzimuthAngle={currentConfig.minAzimuthAngle}
      maxAzimuthAngle={currentConfig.maxAzimuthAngle}
      enableDamping={true}
      dampingFactor={0.05}
    />
  )
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [currentView, setCurrentView] = useState<ViewType>('default')
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [subtitleText, setSubtitleText] = useState('')
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [infoPanelType, setInfoPanelType] = useState<InfoPanelType>('root')
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  const [showFullscreenEvaporation, setShowFullscreenEvaporation] = useState(false)
  
  // Water 뷰 전용 상태
  const [waterPhase, setWaterPhase] = useState<1 | 2>(1)
  const [showLeafPulse, setShowLeafPulse] = useState(false)
  const waterAudioRef = useRef<HTMLAudioElement | null>(null)

  const orbitControlsRef = useRef<any>(null)
  const narrationTexts = useMemo(() => getNarrationTexts(), [])

  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  const { playSound, playNarration, playBackgroundSound, stopBackgroundSound, stopAll } = usePlantAudio()
  const [showActivityGuide, setShowActivityGuide] = useState(false)
  const handleCloseActivityGuide = useCallback(() => setShowActivityGuide(false), [])
  const handleShowActivityGuide = () => {
    audioManager.playGeneralButton()
    setShowActivityGuide(true)
  }

  useEffect(() => {
    if (!mounted) return
    try {
      const saved = localStorage.getItem('bgmEnabled')
      if (saved !== null) setBgmEnabled(JSON.parse(saved))
    } catch {}
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const el = new Audio('/sounds/6-1-3/6-1-3-BGM.mp3')
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

  const toggleBgm = useCallback(() => setBgmEnabled((v) => !v), [])

  const showSubtitleWithDelay = useCallback(
    (type: keyof typeof narrationTexts) => {
      setSubtitleText(narrationTexts[type])
      setShowSubtitle(true)
    },
    [narrationTexts],
  )

  const handleViewChange = useCallback(
    (view: ViewType) => {
      setCurrentView(view)

      if (view !== 'default' && view !== 'water') {
        playNarration(view as 'root' | 'stem' | 'leaf')
        showSubtitleWithDelay(view as keyof typeof narrationTexts)
      } else if (view === 'water') {
        // water 뷰는 handleWaterFlowClick에서 처리
        setShowSubtitle(false)
      } else {
        setShowSubtitle(false)
      }

      if (view !== 'default' && view !== 'water') {
        setInfoPanelType(view as InfoPanelType)
        setShowInfoPanel(true)
      } else {
        setShowInfoPanel(false)
        stopBackgroundSound()
      }
      playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    },
    [playNarration, showSubtitleWithDelay, stopBackgroundSound, playSound, narrationTexts],
  )

  // Water 뷰 진입 시 오디오 재생 시작
  useEffect(() => {
    if (currentView !== 'water') {
      // water 뷰가 아니면 상태 초기화
      setWaterPhase(1)
      setShowLeafPulse(false)
      if (waterAudioRef.current) {
        waterAudioRef.current.pause()
        waterAudioRef.current = null
      }
      return
    }

    // water 뷰 진입 시 오디오 한 번만 재생 시작
    if (waterPhase === 1 && !waterAudioRef.current) {
      setShowLeafPulse(false)
      setSubtitleText(narrationTexts.waterPhase1)
      setShowSubtitle(true)
      
      // 오디오 재생
      const audio = new Audio('/sounds/6-1-3/narration/6-1-3-D-1.mp3')
      audio.volume = 0.8
      waterAudioRef.current = audio
      
      // 오디오 메타데이터 로드 후 중간 지점 계산
      audio.addEventListener('loadedmetadata', () => {
        const transitionTime = audio.duration * 0.45 // 중간 지점에서 Phase 2로 전환
        
        let hasTransitioned = false
        audio.addEventListener('timeupdate', () => {
          if (!hasTransitioned && audio.currentTime >= transitionTime) {
            hasTransitioned = true
            setWaterPhase(2)
          }
        })
      })
      
      audio.play().catch((error) => {
        console.log('Water narration playback failed:', error)
      })
    }

    return () => {
      // 뷰가 변경될 때만 오디오 정리
      if (currentView !== 'water' && waterAudioRef.current) {
        waterAudioRef.current.pause()
        waterAudioRef.current = null
      }
    }
  }, [currentView, narrationTexts])

  // Phase 2: 잎 증발 + pulse (오디오는 계속 재생)
  useEffect(() => {
    if (currentView === 'water' && waterPhase === 2) {
      setSubtitleText(narrationTexts.waterPhase2)
      setShowSubtitle(true)
      setShowLeafPulse(true)
    }
  }, [currentView, waterPhase, narrationTexts])

  const handleWaterFlowClick = useCallback(() => {
    setCurrentView('water')
    setWaterPhase(1)
    playBackgroundSound()
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
  }, [playBackgroundSound, playSound])

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true)
    setCurrentView('default')
    setWaterPhase(1)
    setShowLeafPulse(false)

    stopAll()
    setShowSubtitle(false)
  }, [stopAll])

  const handleEnterExperience = useCallback(() => {
    playSound('/sounds/Enter_Cute.mp3')
    setBgmReady(true)
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }, [playSound])

  const handleLoadingComplete = useCallback(() => setIsLoaded(true), [])

  const handleCloseInfoPanel = useCallback(() => {
    setShowInfoPanel(false)
  }, [])

  const handleLeafClick = useCallback(() => {
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    setShowFullscreenEvaporation(true)
  }, [playSound])

  const handleCloseFullscreenEvaporation = useCallback(() => {
    setShowFullscreenEvaporation(false)
  }, [])

  const hasContent = !showIntro

  return (
    <div className='w-screen h-screen bg-white flex flex-col overflow-hidden relative'>
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
        bg={roomTheme.goal.bg}
        className='z-[200]'
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
        bg={roomTheme.goal.bg}
        className='z-[200]'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      <div className='flex-1'>
        <Scene shadows camera={{ position: [14, 3, 20], fov: 50, near: 0.1, far: 200 }}>
          <ambientLight intensity={0.2} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-bias={-0.0001}
          />

          <TiltOnMouse enabled={showIntro} maxDeg={5}>
            <group rotation={[0, Math.PI + Math.PI / 2, 0]} position={[0, -2, 0]}>
              <Model
                showWaterPipes={currentView === 'water'}
                showStempipes={currentView === 'stem'}
                showLeafArrow={currentView === 'leaf'}
                enableLeafClick={currentView === 'water' && showLeafPulse}
                onLeafClick={handleLeafClick}
              />
              
              {/* 뿌리 물 흡수 - water 뷰의 모든 phase에서 표시 */}
              <RootWaterAbsorption
                isActive={currentView === 'root' || currentView === 'water'}
                rootPosition={new THREE.Vector3(6.0, -3.3, 1.42)}
              />
              <RootWaterAbsorption
                isActive={currentView === 'root' || currentView === 'water'}
                rootPosition={new THREE.Vector3(6.0, -3.4, 1.42)}
              />
              <RootWaterAbsorption
                isActive={currentView === 'root' || currentView === 'water'}
                rootPosition={new THREE.Vector3(6.28, -3.7, 1.42)}
                ringRadiusMin={0.2}
                ringRadiusMax={2.0}
                swirl={1.0}
              />

              {/* 잎 증발 - water 뷰의 phase 2부터 표시 */}
              <LeafEvaporation 
                isActive={currentView === 'leaf' || (currentView === 'water' && waterPhase === 2)} 
                leafPosition={new THREE.Vector3(-1.7, 5.8, -3.7)}
              />

              {!showIntro && currentView === 'default' && (
                <>
                  <SpeechBubble
                    position={[3.5, -2.5, 2]}
                    text='뿌리 보기'
                    onBubbleClick={() => handleViewChange('root')}
                    bubbleOffset={[1, 0.5, 0]}
                  />

                  <SpeechBubble
                    position={[0.5, 2, -1.0]}
                    text='줄기 보기'
                    onBubbleClick={() => handleViewChange('stem')}
                    bubbleOffset={[-1, 0.5, 0]}
                  />

                  <SpeechBubble
                    position={[0.5, 5, -4]}
                    text='잎 보기'
                    onBubbleClick={() => handleViewChange('leaf')}
                    bubbleOffset={[0, 0.5, 0]}
                  />
                </>
              )}
            </group>
          </TiltOnMouse>

          <Sky
            distance={4500}
            sunPosition={[-10, 0.7, -10]}
            inclination={0.49}
            azimuth={0.25}
            rayleigh={1.2}
            turbidity={1}
            mieCoefficient={0.08}
            mieDirectionalG={0.85}
          />

          <Clouds material={THREE.MeshBasicMaterial} position={[0, 10, 0]}>
            <Cloud
              seed={2}
              position={[0, 5, 0]}
              bounds={[8, 0.001, 8]}
              scale={[5, 5, 3]}
              volume={5}
              color='white'
              fade={70}
            />
          </Clouds>

          <Environment preset={'sunset'} />

          {hasContent && <ViewBasedControls currentView={currentView} orbitControlsRef={orbitControlsRef} />}
        </Scene>
      </div>

      {hasContent && isLoaded && (
        <>
          <ViewControls 
            currentView={currentView} 
            onViewChange={handleViewChange} 
            stopAll={() => {
              stopAll()
              setWaterPhase(1)
              setShowLeafPulse(false)
            }} 
          />

          <WaterFlowButton isVisible={currentView === 'default'} onClick={handleWaterFlowClick} />

          <SubtitleBox text={subtitleText} isVisible={showSubtitle} />
          
          <LeafAnimation isVisible={currentView === 'leaf'} />
          
          <FullscreenEvaporation 
            isVisible={showFullscreenEvaporation} 
            onClose={handleCloseFullscreenEvaporation}
            autoCloseDuration={6000}
          />
        </>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='식물에서 물의 이동 관찰하기'
          description={['식물에서 물의 이동을 관찰해 봅시다.']}
          backgroundSvg='/img/cover/6-1-3.svg'
          descriptionSound='/sounds/6-1-3/narration/6-1-3-Goal.MP3'
          buttonTheme={roomTheme}
          onActivityGuide={handleShowActivityGuide}
        />
      )}
      <ActivityGuideModal isOpen={showActivityGuide} onClose={handleCloseActivityGuide} />
    </div>
  )
}