import { useThree } from '@react-three/fiber'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Environment, useProgress, OrbitControls, Sky, Cloud, Clouds } from '@react-three/drei'
import * as THREE from 'three'

import { Model } from '../components/6-1-3/Model'
import { WaterFlowAnimation } from '../components/6-1-3/WaterFlowAnimation'
import { SpeechBubble } from '../components/6-1-3/SpeechBubble'
import { RootWaterAbsorption, LeafEvaporation, StemWaterMovement } from '../components/6-1-3/WaterFlowEffects'
import { SubtitleBox, InfoPanel, WaterFlowButton, ViewControls } from '../components/6-1-3/PlantUI'
import { WaterPathEditor } from '../components/6-1-3/WaterPathEditor'
import { DeveloperControls } from '../components/6-1-3/DeveloperControls'
import Scene from '../components/canvas/Scene'
import Intro from '../components/intro/Intro'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { TiltOnMouse } from '@/components/common/Tilt'
import { usePlantAudio } from '@/hook/6-1-3/useAudio'
import { CAMERA_CONFIGS, getBasePathPoints, getNarrationTexts, ViewType, InfoPanelType } from '@/utils/6-1-3/utils'

function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

function ViewBasedControls({ currentView, orbitControlsRef }: { currentView: ViewType; orbitControlsRef: React.RefObject<any> }) {
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
      enablePan={false}
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
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false)
  const [showPath, setShowPath] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [subtitleText, setSubtitleText] = useState('')
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [infoPanelType, setInfoPanelType] = useState<InfoPanelType>('root')

  // Developer controls state
  const [pathPoints, setPathPoints] = useState<THREE.Vector3[]>(() => getBasePathPoints())
  const [isPathEditorVisible, setIsPathEditorVisible] = useState(false)
  const [isDeveloperMode, setIsDeveloperMode] = useState(false)

  const orbitControlsRef = useRef<any>(null)
  const narrationTexts = useMemo(() => getNarrationTexts(), [])

  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true)
  const [bgmReady, setBgmReady] = useState(false)

  const { playSound, playNarration, playBackgroundSound, stopBackgroundSound } = usePlantAudio()

  // Check for developer mode (you can use localStorage or URL params)
  useEffect(() => {
    if (!mounted) return
    
    // Enable developer mode with URL parameter or localStorage
    const urlParams = new URLSearchParams(window.location.search)
    const devMode = urlParams.get('dev') === 'true' || localStorage.getItem('devMode') === 'true'
    setIsDeveloperMode(devMode)
    
    // Keyboard shortcut for toggling dev mode (Ctrl/Cmd + D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        setIsDeveloperMode(prev => {
          const newValue = !prev
          localStorage.setItem('devMode', newValue.toString())
          return newValue
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mounted])

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

      if (view !== 'default') {
        playNarration(view as 'root' | 'stem' | 'leaf' | 'water')
        showSubtitleWithDelay(view as keyof typeof narrationTexts)
      } else {
        setIsAnimationPlaying(false)
        setShowSubtitle(false)
      }

      if (view !== 'default' && view !== 'water') {
        setInfoPanelType(view as InfoPanelType)
        setShowInfoPanel(true)
      } else {
        setShowInfoPanel(false)
      }
      playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3')
    },
    [playNarration, showSubtitleWithDelay, playBackgroundSound, stopBackgroundSound, playSound, narrationTexts],
  )

  const handleWaterFlowClick = useCallback(() => {
    handleViewChange('water')
    setIsAnimationPlaying(true)
  }, [handleViewChange])

  const handleBackToIntro = useCallback(() => {
    setShowIntro(true)
    setCurrentView('default')
    setIsAnimationPlaying(false)
    stopBackgroundSound()
  }, [stopBackgroundSound])

  const handleEnterExperience = useCallback(() => {
    playSound('/sounds/Enter_Cute.mp3')
    playBackgroundSound()
    setBgmReady(true)
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }, [playSound])

  const handleLoadingComplete = useCallback(() => setIsLoaded(true), [])

  const handleCloseInfoPanel = useCallback(() => {
    setShowInfoPanel(false)
  }, [])

  const handleAnimationComplete = useCallback(() => {
    console.log('물 이동 애니메이션 완료!')
  }, [])

  // Developer controls handlers
  const handlePathChange = useCallback((newPoints: THREE.Vector3[]) => {
    setPathPoints(newPoints)
  }, [])

  const togglePathEditor = useCallback(() => {
    setIsPathEditorVisible(prev => !prev)
  }, [])

  const hasContent = !showIntro

  return (
    <div className='w-screen h-screen bg-white flex flex-col overflow-hidden relative'>
      <LoadingTracker onLoadingComplete={handleLoadingComplete} />

      {/* Developer Controls */}
      {isDeveloperMode && (
        <DeveloperControls
          pathPoints={pathPoints}
          onPathChange={handlePathChange}
          isEditorVisible={isPathEditorVisible}
          onToggleEditor={togglePathEditor}
        />
      )}

      <CrayonTextButton
        ariaLabel={'첫 화면으로'}
        icon={'home'}
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={108}
        height={108}
        color='#ffffff'
        textcolor='#ffffff'
        bg='rgba(255,255,255,0.10)'
        className='background-blur z-[200] mix-blend-difference'
        right={138}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      <CrayonTextButton
        icon={bgmEnabled ? 'volume2' : 'volumeX'}
        position='absolute'
        iconPosition='left'
        onClick={toggleBgm}
        width={108}
        height={108}
        color='#fff'
        textcolor='#fff'
        bg='rgba(255,255,255,0.10)'
        className='backdrop-blur z-[1000] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      <div className='flex-1'>
        <Scene shadows camera={{ position: [16, 3, 20], fov: 50 }}>
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
              <Model />

              {isAnimationPlaying && (
                <group rotation={[0, (Math.PI * 4) / 3, 0]}>
                  <WaterFlowAnimation
                    arrowSize={2}
                    lineWidth={1.5}
                    isPlaying={isAnimationPlaying}
                    speed={0.3}
                    pathPoints={pathPoints} // Use dynamic path points
                    showPath={showPath}
                    onComplete={handleAnimationComplete}
                    loop={true}
                    trailCount={8}
                    trailSpacing={0.12}
                  />
                </group>
              )}

              {/* Water Path Editor - 회전 그룹 밖에서 독립적으로 */}
              {isDeveloperMode && (
                <WaterPathEditor
                  pathPoints={pathPoints.map(p => {
                    // 회전 변환 적용
                    const rotated = p.clone()
                    rotated.applyEuler(new THREE.Euler(0, (Math.PI * 4) / 3, 0))
                    rotated.y += -2 // y 오프셋 적용
                    return rotated
                  })}
                  onPathChange={(newPoints) => {
                    // 역변환 적용
                    const unrotatedPoints = newPoints.map(p => {
                      const unrotated = p.clone()
                      unrotated.y -= -2 // y 오프셋 제거
                      unrotated.applyEuler(new THREE.Euler(0, -(Math.PI * 4) / 3, 0))
                      return unrotated
                    })
                    handlePathChange(unrotatedPoints)
                  }}
                  visible={isPathEditorVisible}
                  orbitControlsRef={orbitControlsRef}
                />
              )}

              <RootWaterAbsorption
                isActive={currentView === 'root'}
                rootPosition={new THREE.Vector3(3.48, -2.42, 1.82)}
              />

              <group position={[0.8, 0, -0.2]}>
                <StemWaterMovement isActive={currentView === 'stem'} pathPoints={pathPoints} />
              </group>

              <LeafEvaporation isActive={currentView === 'leaf'} leafPosition={new THREE.Vector3(2.15, 10.1, -1.36)} />

              {!showIntro && currentView === 'default' && (
                <>
                  <SpeechBubble
                    position={[3.5, -2.5, 2]}
                    text='뿌리 보기'
                    onBubbleClick={() => handleViewChange('root')}
                    pointColor='#8B4513'
                    bubbleOffset={[1, 0.5, 0]}
                  />

                  <SpeechBubble
                    position={[0.5, 3, 0.5]}
                    text='줄기 보기'
                    onBubbleClick={() => handleViewChange('stem')}
                    pointColor='#228B22'
                    bubbleOffset={[-1, 0.5, 0]}
                  />

                  <SpeechBubble
                    position={[2, 9.5, 1.5]}
                    text='잎 보기'
                    onBubbleClick={() => handleViewChange('leaf')}
                    pointColor='#32CD32'
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

          <Clouds material={THREE.MeshBasicMaterial} position={[0, 16, 0]}>
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
          <ViewControls currentView={currentView} onViewChange={handleViewChange} />

          <WaterFlowButton isVisible={currentView === 'default'} onClick={handleWaterFlowClick} />

          <SubtitleBox text={subtitleText} isVisible={showSubtitle} />

          <InfoPanel type={infoPanelType} isVisible={showInfoPanel} onClose={handleCloseInfoPanel} />
        </>
      )}

      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='식물에서의 물의 이동 관찰하기'
          description={['식물에서 물의 이동을 관찰해 봅시다.']}
          backgroundSvg='/img/cover/6-1-3.svg'
          descriptionSound='/sounds/6-1-3/narration/6-1-3-Goal.MP3'
        />
      )}
    </div>
  )
}