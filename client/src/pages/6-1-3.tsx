import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, Sky, TransformControls, useProgress, Cloud, Clouds } from '@react-three/drei'
import { Model } from '../components/6-1-3/Model'
import Scene from '@/components/canvas/Scene'
import Intro from '@/components/intro/Intro'
import { useState, useRef, useEffect, useMemo, Suspense } from 'react'
import * as THREE from 'three'
import { WaterFlowAnimation } from '../components/6-1-3/WaterFlowAnimation'
import { ControlPoint } from '../components/6-1-3/ControlPoint'
import { SpeechBubble } from '../components/6-1-3/SpeechBubble'
import IntroMouseCameraController from '@/components/intro/IntroMouseCameraController'

// 뿌리 물 흡수 애니메이션 컴포넌트
function RootWaterAbsorption({ isActive, rootPosition }) {
  const particlesRef = useRef([])
  const groupRef = useRef<THREE.Group>(null)

  // 물방울 파티클 생성
  const particles = useMemo(() => {
    const particleCount = 80
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = 3 + Math.random() * 4
      const height = -2 + Math.random() * 4

      particles.push({
        id: i,
        startPosition: new THREE.Vector3(
          rootPosition.x + Math.cos(angle) * radius,
          rootPosition.y + height,
          rootPosition.z + Math.sin(angle) * radius,
        ),
        targetPosition: rootPosition.clone(),
        currentPosition: new THREE.Vector3(),
        progress: Math.random() * 0.8,
        speed: 0.1 + Math.random() * 0.1,
        scale: 0.08 + Math.random() * 0.12,
      })
    }
    return particles
  }, [rootPosition])

  useFrame((state, delta) => {
    if (!isActive || !groupRef.current) return

    particles.forEach((particle, index) => {
      particle.progress += delta * particle.speed

      if (particle.progress >= 1) {
        particle.progress = 0
      }

      const t = particle.progress
      const eased = 1 - Math.pow(1 - t, 3)

      particle.currentPosition.copy(particle.startPosition).lerp(particle.targetPosition, eased)

      const scale = particle.scale * (1 - eased * 0.8)

      const mesh = groupRef.current?.children[index] as THREE.Mesh
      if (mesh) {
        mesh.position.copy(particle.currentPosition)
        mesh.scale.setScalar(scale)
        const material = mesh.material as THREE.MeshStandardMaterial
        material.opacity = 1 - eased * 0.5
      }
    })
  })

  return (
    <group ref={groupRef} visible={isActive}>
      {particles.map((particle) => (
        <mesh key={particle.id} position={particle.startPosition}>
          <sphereGeometry args={[particle.scale, 12, 12]} />
          <meshStandardMaterial
            color='#2196F3'
            transparent
            opacity={0.9}
            metalness={0.3}
            roughness={0.1}
            emissive='#0066CC'
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}
    </group>
  )
}

// 잎 증발 애니메이션 컴포넌트
function LeafEvaporation({ isActive, leafPosition }) {
  const particlesRef = useRef([])
  const groupRef = useRef<THREE.Group>(null)

  const particles = useMemo(() => {
    const particleCount = 40
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2
      const radius = 0.3 + Math.random() * 0.8

      particles.push({
        id: i,
        startPosition: new THREE.Vector3(
          leafPosition.x + Math.cos(angle) * radius,
          leafPosition.y - 0.2,
          leafPosition.z + Math.sin(angle) * radius,
        ),
        targetPosition: new THREE.Vector3(
          leafPosition.x + Math.cos(angle) * (radius + 1),
          leafPosition.y + 4 + Math.random() * 2,
          leafPosition.z + Math.sin(angle) * (radius + 1),
        ),
        currentPosition: new THREE.Vector3(),
        progress: Math.random() * 0.6,
        speed: 0.15 + Math.random() * 0.15,
        scale: 0.04 + Math.random() * 0.06,
      })
    }
    return particles
  }, [leafPosition])

  useFrame((state, delta) => {
    if (!isActive || !groupRef.current) return

    particles.forEach((particle, index) => {
      particle.progress += delta * particle.speed

      if (particle.progress >= 1) {
        particle.progress = 0
      }

      const t = particle.progress
      const eased = t * t

      particle.currentPosition.copy(particle.startPosition).lerp(particle.targetPosition, eased)

      const scale = particle.scale * (1 + eased * 3)
      const opacity = 0.9 * (1 - eased)

      const mesh = groupRef.current?.children[index] as THREE.Mesh
      if (mesh) {
        mesh.position.copy(particle.currentPosition)
        mesh.scale.setScalar(scale)
        const material = mesh.material as THREE.MeshStandardMaterial
        material.opacity = opacity
      }
    })
  })

  return (
    <group ref={groupRef} visible={isActive}>
      {particles.map((particle) => (
        <mesh key={particle.id} position={particle.startPosition}>
          <sphereGeometry args={[particle.scale, 12, 12]} />
          <meshStandardMaterial
            color='#E3F2FD'
            transparent
            opacity={0.6}
            metalness={0}
            roughness={0.9}
            emissive='#BBDEFB'
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

// 줄기 물 이동 애니메이션 컴포넌트 (강화 버전)
function StemWaterMovement({ isActive, pathPoints }) {
  const particlesRef = useRef([])
  const groupRef = useRef<THREE.Group>(null)
  const pulseRef = useRef<THREE.Group>(null)

  const particles = useMemo(() => {
    const particleCount = 120 // 더 많은 파티클
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: i,
        progress: (i / particleCount) * 1.2, // 더 긴 시작 지연
        speed: 0.05 + Math.random() * 0.15, // 더 빠른 속도
        scale: 0.08 + Math.random() * 0.06, // 더 큰 파티클
        currentPosition: new THREE.Vector3(),
        opacity: 0.9 + Math.random() * 0.1,
        waveOffset: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }
    return particles
  }, [])

  // 파이프라인 효과를 위한 추가 파티클
  const pipelineParticles = useMemo(() => {
    const count = 30
    const particles = []

    for (let i = 0; i < count; i++) {
      particles.push({
        id: i,
        progress: (i / count) * 0.9,
        speed: 0.3,
        scale: 0.12 + Math.random() * 0.08,
        currentPosition: new THREE.Vector3(),
        glowIntensity: 0.5 + Math.random() * 0.5,
      })
    }
    return particles
  }, [])

  const getPositionOnPath = (t) => {
    const clampedT = Math.max(0, Math.min(1, t))
    const segmentIndex = Math.floor(clampedT * (pathPoints.length - 1))
    const localT = (clampedT * (pathPoints.length - 1)) % 1

    if (segmentIndex >= pathPoints.length - 1) {
      return pathPoints[pathPoints.length - 1].clone()
    }

    const startPoint = pathPoints[segmentIndex]
    const endPoint = pathPoints[segmentIndex + 1]

    return startPoint.clone().lerp(endPoint, localT)
  }

  useFrame((state, delta) => {
    if (!isActive || !groupRef.current) return

    const time = state.clock.elapsedTime

    // 메인 파티클 애니메이션
    particles.forEach((particle, index) => {
      particle.progress += delta * particle.speed

      if (particle.progress >= 1.1) {
        particle.progress = -0.1 // 약간의 딜레이로 재시작
      }

      if (particle.progress >= 0 && particle.progress <= 1) {
        const position = getPositionOnPath(particle.progress)

        // 약간의 웨이브 효과 추가
        const waveX = Math.sin(time * 2 + particle.waveOffset) * 0.1
        const waveZ = Math.cos(time * 2 + particle.waveOffset) * 0.1

        particle.currentPosition.copy(position)
        particle.currentPosition.x += waveX
        particle.currentPosition.z += waveZ

        const mesh = groupRef.current?.children[index] as THREE.Mesh
        if (mesh) {
          mesh.position.copy(particle.currentPosition)

          // 동적 스케일링
          const pulseScale = 1 + Math.sin(time * 4 + particle.pulsePhase) * 0.3
          mesh.scale.setScalar(particle.scale * pulseScale)

          const material = mesh.material as THREE.MeshStandardMaterial

          // 진행도에 따른 투명도 및 발광 조절
          const visibility = Math.sin(particle.progress * Math.PI)
          material.opacity = particle.opacity * visibility * 0.9
          material.emissiveIntensity = 0.3 + Math.sin(time * 3 + particle.pulsePhase) * 0.2
        }
      }
    })

    // 파이프라인 파티클 애니메이션 (더 큰 발광 파티클)
    pipelineParticles.forEach((particle, index) => {
      particle.progress += delta * particle.speed

      if (particle.progress >= 1.1) {
        particle.progress = -0.1
      }

      if (particle.progress >= 0 && particle.progress <= 1) {
        const position = getPositionOnPath(particle.progress)
        particle.currentPosition.copy(position)

        const meshIndex = particles.length + index
        const mesh = groupRef.current?.children[meshIndex] as THREE.Mesh
        if (mesh) {
          mesh.position.copy(particle.currentPosition)

          // 더 강한 펄스 효과
          const pulseScale = 1 + Math.sin(time * 6 + index) * 0.5
          mesh.scale.setScalar(particle.scale * pulseScale)

          const material = mesh.material as THREE.MeshStandardMaterial
          const visibility = Math.sin(particle.progress * Math.PI)
          material.opacity = visibility * 0.8
          material.emissiveIntensity = particle.glowIntensity + Math.sin(time * 5 + index) * 0.4
        }
      }
    })
  })

  return (
    <group ref={groupRef} visible={isActive}>
      {/* 메인 물 파티클들 */}
      {particles.map((particle) => (
        <mesh key={particle.id}>
          <sphereGeometry args={[particle.scale, 12, 12]} />
          <meshStandardMaterial
            color='#4FC3F7'
            transparent
            opacity={particle.opacity}
            metalness={0.4}
            roughness={0.2}
            emissive='#03A9F4'
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* 파이프라인 발광 파티클들 */}
      {pipelineParticles.map((particle) => (
        <mesh key={`pipeline-${particle.id}`}>
          <sphereGeometry args={[particle.scale, 16, 16]} />
          <meshStandardMaterial
            color='#00E5FF'
            transparent
            opacity={0.7}
            metalness={0.1}
            roughness={0.1}
            emissive='#00BCD4'
            emissiveIntensity={particle.glowIntensity}
          />
        </mesh>
      ))}
    </group>
  )
}

// 되돌아가기 버튼 컴포넌트
function BackButton({ isVisible, onBack }) {
  if (!isVisible) return null

  return (
    <div className='fixed top-4 left-4 z-50'>
      <button
        onClick={onBack}
        className='flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 hover:bg-white hover:shadow-xl transition-all duration-200 group'>
        <span className='text-lg font-bold text-gray-700 group-hover:text-gray-900 transition-colors'>전체 보기</span>
      </button>
    </div>
  )
}

// 물의 이동 확인하기 버튼 컴포넌트
function WaterFlowButton({ isVisible, onClick }) {
  if (!isVisible) return null

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      <button
        onClick={onClick}
        className='flex items-center font-bold gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group'>
        <span className='text-lg'>물의 이동 확인하기</span>
      </button>
    </div>
  )
}

// 자막 컴포넌트
function Subtitle({ text, isVisible }) {
  if (!isVisible) return null

  return (
    <div className='fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50 max-w-4xl'>
      <div className='bg-black/80 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg'>
        <p className='text-white text-lg font-light text-center leading-relaxed'>{text}</p>
      </div>
    </div>
  )
}

// 정보 패널 컴포넌트
function InfoPanel({ type, isVisible, onClose }) {
  const infoData = {
    root: {
      title: '뿌리',
      image: '/img/뿌리.png',
    },
    stem: {
      title: '줄기',
      image: '/img/줄기.png',
    },
    leaf: {
      title: '잎',
      image: '/img/잎.png',
    },
  }

  const info = infoData[type]

  if (!isVisible || !info) return null

  return (
    <div className='fixed top-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4 z-50 border'>
      <div className='flex justify-between items-center mb-3'>
        <h3 className='text-lg font-bold text-gray-800'>{info.title}</h3>
        <button onClick={onClose} className='text-gray-500 hover:text-gray-700 text-xl'>
          ×
        </button>
      </div>
      <img src={info.image} alt={info.title} className='w-full h-full object-cover rounded mb-3' />
      <p className='text-sm text-gray-600 leading-relaxed'>{info.description}</p>
    </div>
  )
}

// 카메라 애니메이션 컴포넌트
function CameraAnimator({
  targetPosition,
  targetLookAt,
  onAnimationComplete,
}: {
  targetPosition: THREE.Vector3 | null
  targetLookAt: THREE.Vector3 | null
  onAnimationComplete: () => void
}) {
  const { camera } = useThree()
  const startPosition = useRef<THREE.Vector3>(new THREE.Vector3())
  const startLookAt = useRef<THREE.Vector3>(new THREE.Vector3())
  const animationProgress = useRef(0)
  const isAnimating = useRef(false)

  useFrame((state, delta) => {
    if (!targetPosition || !targetLookAt || !isAnimating.current) return

    const duration = 2.0
    animationProgress.current += delta / duration

    if (animationProgress.current >= 1) {
      camera.position.copy(targetPosition)
      camera.lookAt(targetLookAt)
      isAnimating.current = false
      animationProgress.current = 0
      onAnimationComplete()
      return
    }

    const t = animationProgress.current
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    const currentPosition = startPosition.current.clone().lerp(targetPosition, eased)
    const currentLookAt = startLookAt.current.clone().lerp(targetLookAt, eased)

    camera.position.copy(currentPosition)
    camera.lookAt(currentLookAt)
  })

  useEffect(() => {
    if (targetPosition && targetLookAt) {
      startPosition.current.copy(camera.position)
      startLookAt.current.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(10))
      animationProgress.current = 0
      isAnimating.current = true
    }
  }, [targetPosition, targetLookAt, camera])

  return null
}

// 로딩 상태를 추적하는 컴포넌트
function LoadingTracker({ onLoadingComplete }: { onLoadingComplete: () => void }) {
  const { progress, active } = useProgress()

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete()
    }
  }, [active, progress, onLoadingComplete])

  return null
}

export default function Home() {
  // 기본 경로 정의
  const [basePathPoints, setBasePathPoints] = useState([
    new THREE.Vector3(3.48, -2.42, 1.82),
    new THREE.Vector3(1.62, -1.42, 0.92),
    new THREE.Vector3(1.62, -1, 0.2),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.3, 1.52, -0.1),
    new THREE.Vector3(-0.3, 3.61, -0.13),
    new THREE.Vector3(-0.3, 4.61, -0.17),
    new THREE.Vector3(-0.3, 6.28, -0.21),
    new THREE.Vector3(-0.3, 7.28, -0.24),
    new THREE.Vector3(-0.3, 8.28, -0.23),
    new THREE.Vector3(-0.3, 9.28, 0),
    new THREE.Vector3(2.15, 10.1, 1.36),
  ])

  // 3개 경로의 설정
  const waterFlowConfigs = [{ rotation: (Math.PI * 4) / 3, color: '#ff8a65', name: '물길 3', isActive: true }]

  const [activeConfigs, setActiveConfigs] = useState(waterFlowConfigs)
  const sceneRef = useRef<THREE.Group>(null)
  const orbitControlsRef = useRef<any>(null)
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false) // 기본값을 false로 변경
  const [showPath, setShowPath] = useState(true)
  const [showTransformControls, setShowTransformControls] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [selectedPointPosition, setSelectedPointPosition] = useState<THREE.Vector3 | null>(null)

  // Intro 관련 상태
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)

  // 루프 관련 상태
  const [isLooping, setIsLooping] = useState(true)
  const [animationSpeed, setAnimationSpeed] = useState(0.3)
  const [trailCount, setTrailCount] = useState(8)
  const [trailSpacing, setTrailSpacing] = useState(0.12)
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null)

  // 카메라 애니메이션 관련 상태
  const [cameraTarget, setCameraTarget] = useState<{
    position: THREE.Vector3
    lookAt: THREE.Vector3
  } | null>(null)
  const [isViewingSpecificPart, setIsViewingSpecificPart] = useState(false)
  const [originalCameraState, setOriginalCameraState] = useState<{
    position: THREE.Vector3
    lookAt: THREE.Vector3
  } | null>(null)
  const [orbitTarget, setOrbitTarget] = useState<[number, number, number]>([0, 3, 0])

  // 특수 효과 상태
  const [currentView, setCurrentView] = useState<'default' | 'root' | 'stem' | 'leaf' | 'water'>('default')
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [infoPanelType, setInfoPanelType] = useState<'root' | 'stem' | 'leaf'>('root')

  // 자막 관련 상태
  const [showSubtitle, setShowSubtitle] = useState(false)
  const [subtitleText, setSubtitleText] = useState('')

  // 나레이션 텍스트 매핑
  const narrationTexts = {
    root: '뿌리는 식물에 필요한 물을 흡수합니다.',
    stem: '뿌리에서 흡수한 물은 줄기를 통해 잎으로 이동합니다.',
    leaf: '잎에 도달한 물이 수증기가 되어 기공을 통해 잎 밖으로 빠져나갑니다.',
    water: '뿌리에서 흡수된 물은 어떻게 되는지 살펴봅시다.',
  }

  // 나레이션 파일 경로 매핑
  const narrationFiles = {
    root: '/sounds/6-1-3/narration/6-1-3-B.MP3',
    stem: '/sounds/6-1-3/narration/6-1-3-C.MP3',
    leaf: '/sounds/6-1-3/narration/6-1-3-A.MP3',
    water: '/sounds/6-1-3/narration/6-1-3-D.MP3',
  }

  // 카메라 위치 프리셋
  const cameraPresets = {
    default: {
      position: new THREE.Vector3(16, 3, 20),
      lookAt: new THREE.Vector3(0, 0, 0),
    },
    leaf: {
      position: new THREE.Vector3(4, 10, 6),
      lookAt: new THREE.Vector3(2.15, 8.1, 1.36),
    },
    root: {
      position: new THREE.Vector3(8, -4, 12),
      lookAt: new THREE.Vector3(3.48, -2.42, 1.82),
    },
    stem: {
      position: new THREE.Vector3(5, 4, 8),
      lookAt: new THREE.Vector3(0, 3, 0),
    },
    water: {
      position: new THREE.Vector3(16, 3, 20),
      lookAt: new THREE.Vector3(0, 0, 0),
    },
  }

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  const playClickSound = (audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playGeneralButton = (audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.5
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const playBackgroundButton = (audioPath: string = '/sounds/6-1-3/6-1-3-2_ambient-bubbling-liquid-61254.mp3') => {
    try {
      // 기존 배경음이 있으면 중지
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause()
        backgroundAudioRef.current.currentTime = 0
      }

      const audio = new Audio(audioPath)
      audio.volume = 0.3
      audio.loop = true // 반복 재생
      backgroundAudioRef.current = audio

      audio.play().catch((error) => {
        console.log('배경음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('배경음 생성 실패:', error)
    }
  }

  const stopBackgroundButton = () => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause()
      backgroundAudioRef.current.currentTime = 0
      backgroundAudioRef.current = null
    }
  }

  // 나레이션 재생 함수
  const playNarration = (type: 'root' | 'stem' | 'leaf' | 'water') => {
    try {
      const audio = new Audio(narrationFiles[type])
      audio.volume = 0.8
      audio.play().catch((error) => {
        console.log('나레이션 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('나레이션 생성 실패:', error)
    }
  }

  // 자막 표시 함수
  const showSubtitleWithDelay = (type: 'root' | 'stem' | 'leaf' | 'water') => {
    setTimeout(() => {
      setSubtitleText(narrationTexts[type])
      setShowSubtitle(true)

      // 5초 후 자막 숨기기
      setTimeout(() => {
        setShowSubtitle(false)
      }, 5000)
    }, 3000)
  }

  const handleEnterExperience = () => {
    playClickSound()
    setTimeout(() => {
      setShowIntro(false)
    }, 300)
  }

  // 카메라 애니메이션 핸들러
  const handleCameraMove = (preset: 'leaf' | 'root' | 'stem' | 'water' | 'default') => {
    // 나레이션 재생 및 자막 표시
    if (preset !== 'default') {
      playNarration(preset)
      showSubtitleWithDelay(preset)
      playBackgroundButton()
    } else {
      stopBackgroundButton()
    }

    // 첫 번째 이동이면 현재 카메라 상태 저장
    if (!isViewingSpecificPart && preset !== 'default') {
      setOriginalCameraState({
        position: new THREE.Vector3(16, 3, 20),
        lookAt: new THREE.Vector3(0, 0, 0),
      })
    }

    const targetPreset = cameraPresets[preset]
    setCameraTarget(targetPreset)

    // OrbitControls target 업데이트
    const lookAtArray: [number, number, number] = [targetPreset.lookAt.x, targetPreset.lookAt.y, targetPreset.lookAt.z]
    setOrbitTarget(lookAtArray)

    // OrbitControls 비활성화 (애니메이션 중)
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = false
    }

    // 현재 뷰 상태 업데이트
    setCurrentView(preset)
    setIsViewingSpecificPart(preset !== 'default')

    // 정보 패널 표시 (물 보기 제외)
    if (preset !== 'default' && preset !== 'water') {
      setInfoPanelType(preset)
      setShowInfoPanel(true)
    } else {
      setShowInfoPanel(false)
    }
  }

  // 물의 이동 확인하기 버튼 핸들러
  const handleWaterFlowClick = () => {
    playGeneralButton()
    handleCameraMove('water')
    setIsAnimationPlaying(true)
  }

  const handleCameraAnimationComplete = () => {
    // 애니메이션 완료 후 OrbitControls 활성화
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = true
    }
    setCameraTarget(null)
  }

  // 정보 패널 닫기
  const handleCloseInfoPanel = () => {
    setShowInfoPanel(false)
  }

  // 모델 로딩 상태 관리
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // 애니메이션 시작 시 편집 모드 비활성화
  useEffect(() => {
    if (isAnimationPlaying && showTransformControls) {
      setShowTransformControls(false)
      setSelectedPointIndex(null)
      setSelectedPointPosition(null)
    }
  }, [isAnimationPlaying, showTransformControls])

  const handleAnimationComplete = () => {
    if (!isLooping) {
      console.log('물 이동 애니메이션 완료!')
      setIsAnimationPlaying(false)
    }
  }

  return (
    <div className='w-screen h-screen bg-white relative'>
      {/* 되돌아가기 버튼 */}
      <BackButton
        isVisible={isViewingSpecificPart && !showIntro}
        onBack={() => {
          handleCameraMove('default')
          playGeneralButton()
          setIsAnimationPlaying(false)
          stopBackgroundButton()
        }}
      />

      {/* 물의 이동 확인하기 버튼 */}
      <WaterFlowButton isVisible={currentView === 'default' && !showIntro} onClick={handleWaterFlowClick} />

      {/* 자막 */}
      <Subtitle text={subtitleText} isVisible={showSubtitle} />

      <Scene camera={{ position: [16, 10, 20], fov: 50 }} shadows='soft'>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <IntroMouseCameraController enabled={showIntro} />

        {/* 카메라 애니메이션 컨트롤러 */}
        <CameraAnimator
          targetPosition={cameraTarget?.position || null}
          targetLookAt={cameraTarget?.lookAt || null}
          onAnimationComplete={handleCameraAnimationComplete}
        />

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

        <group ref={sceneRef} position={[0, -2, 0]} rotation={[0, Math.PI + Math.PI / 2, 0]}>
          <Model />

          {/* 물줄기 애니메이션 - 버튼 클릭 시에만 재생 */}
          {isAnimationPlaying &&
            activeConfigs
              .filter((config) => config.isActive)
              .map((config, index) => (
                <group key={`waterflow-${index}`} rotation={[0, config.rotation, 0]}>
                  <WaterFlowAnimation
                    arrowSize={2}
                    lineWidth={1.5}
                    isPlaying={isAnimationPlaying}
                    speed={animationSpeed}
                    pathPoints={basePathPoints}
                    showPath={showPath}
                    onComplete={handleAnimationComplete}
                    loop={isLooping}
                    trailCount={trailCount}
                    trailSpacing={trailSpacing}
                  />
                </group>
              ))}

          {/* 뿌리 물 흡수 효과 */}
          <RootWaterAbsorption isActive={currentView === 'root'} rootPosition={new THREE.Vector3(3.48, -2.42, 1.82)} />

          {/* 줄기 물 이동 효과 */}
          <group position={[0.8, 0, -0.2]}>
            <StemWaterMovement isActive={currentView === 'stem'} pathPoints={basePathPoints} />
          </group>

          {/* 잎 증발 효과 */}
          <LeafEvaporation isActive={currentView === 'leaf'} leafPosition={new THREE.Vector3(2.15, 10.1, -1.36)} />

          {/* SpeechBubble 컴포넌트들 - 인트로가 끝난 후에만 표시 */}
          {!showIntro && currentView === 'default' && (
            <>
              {/* 뿌리 부분 설명 */}
              <SpeechBubble
                position={[3.5, -2.5, 2]}
                html='<strong>뿌리 보기</strong>'
                onBubbleClick={() => {
                  handleCameraMove('root')
                  playGeneralButton()
                }}
                pointColor='#8B4513'
                bubbleOffset={[1, 0.5, 0]}
              />

              {/* 줄기 부분 설명 */}
              <SpeechBubble
                position={[0.5, 3, 0.5]}
                html='<strong>줄기 보기</strong>'
                onBubbleClick={() => {
                  handleCameraMove('stem')
                  playGeneralButton()
                }}
                pointColor='#228B22'
                bubbleOffset={[-1, 0.5, 0]}
              />

              {/* 잎 부분 설명 */}
              <SpeechBubble
                position={[2, 9.5, 1.5]}
                html='<strong>잎 보기</strong>'
                onBubbleClick={() => {
                  handleCameraMove('leaf')
                  playGeneralButton()
                }}
                pointColor='#32CD32'
                bubbleOffset={[0, 0.5, 0]}
              />
            </>
          )}
        </group>

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

        <OrbitControls
          ref={orbitControlsRef}
          enableZoom={!showIntro}
          enablePan={!showIntro}
          enableRotate={!showIntro}
          minDistance={0}
          maxDistance={22}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0}
          target={orbitTarget}
          enabled={(!showTransformControls || !isDragging) && !showIntro}
        />
      </Scene>

      <InfoPanel type={infoPanelType} isVisible={showInfoPanel} onClose={handleCloseInfoPanel} />

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
