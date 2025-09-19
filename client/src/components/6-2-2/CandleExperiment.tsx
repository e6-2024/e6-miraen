import { useEffect, useRef, useState, useCallback } from 'react'
import { useGLTF, useCursor, Environment, OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CandleLight } from './CandleLight'
import { Flame } from './Flame'
import { ExperimentPhase } from '@/types/6-2-2/types'
import { EXPERIMENT_CONFIG } from '@/utils/6-2-2/utils'

interface CandleExperimentProps {
  experimentStarted: boolean
  experimentFinished: boolean
  onExperimentFinished: () => void
  onPhaseChange: (phase: ExperimentPhase) => void
}

export function CandleExperiment({
  experimentStarted,
  experimentFinished,
  onExperimentFinished,
  onPhaseChange,
}: CandleExperimentProps) {
  const { scene, animations } = useGLTF('/models/6-2-2/Whole_Scene.glb')
  const { camera, gl } = useThree()

  const rightCupRef = useRef<THREE.Object3D>(null)
  const leftCupRef = useRef<THREE.Object3D>(null)
  const oxygenSprayRef = useRef<THREE.Object3D>(null)
  const oxygenButtonRef = useRef<THREE.Object3D>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  const [showFlame, setShowFlame] = useState(false)
  const [leftFlameOpacity, setLeftFlameOpacity] = useState(1)
  const [rightFlameOpacity, setRightFlameOpacity] = useState(1)
  const [rightFlameScale, setRightFlameScale] = useState(1)
  const [hovered, setHovered] = useState(false)
  const [experimentPhase, setExperimentPhase] = useState<ExperimentPhase>('waiting')
  const [rightCupHighlighted, setRightCupHighlighted] = useState(false)
  const [oxygenButtonActive, setOxygenButtonActive] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useCursor(hovered)

  // Animation mixer 설정
  useEffect(() => {
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene)

      animations.forEach((clip, index) => {
        const action = mixerRef.current!.clipAction(clip)
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
      })
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
        mixerRef.current = null
      }
    }
  }, [animations, scene])

  // 애니메이션 업데이트
  useEffect(() => {
    const clock = new THREE.Clock()

    const animate = () => {
      if (mixerRef.current) {
        mixerRef.current.update(clock.getDelta())
      }
      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  // 애니메이션 재생 함수
  const playAnimation = (index: number) => {
    if (mixerRef.current && animations[index]) {
      const action = mixerRef.current.clipAction(animations[index])
      action.reset()
      action.play()
    }
  }

  // 실험 초기화
  useEffect(() => {
    if (!experimentStarted) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)

      setShowFlame(false)
      setLeftFlameOpacity(1)
      setRightFlameOpacity(1)
      setRightFlameScale(1)
      setExperimentPhase('waiting')
      setRightCupHighlighted(false)
      setOxygenButtonActive(false)

      camera.position.set(...EXPERIMENT_CONFIG.cameraPositions.initial)
    }
  }, [experimentStarted, camera])

  // 실험 시작 시 첫 번째 단계로 이동
  useEffect(() => {
    if (experimentStarted && experimentPhase === 'waiting') {
      setExperimentPhase('selectingCup')
      setRightCupHighlighted(true)
      onPhaseChange('selectingCup')
    }
  }, [experimentStarted, experimentPhase, onPhaseChange])

  // 오른쪽 아크릴 통 클릭 처리
  const handleRightCupClick = () => {
    if (experimentPhase !== 'selectingCup') return

    setRightCupHighlighted(false)
    setExperimentPhase('oxygenCanAppearing')
    onPhaseChange('oxygenCanAppearing')

    playAnimation(4)
    playAnimation(5)

    timeoutRef.current = setTimeout(() => {
      setExperimentPhase('oxygenSupply')
      setOxygenButtonActive(true)
      onPhaseChange('oxygenSupply')
    }, 2000)
  }

  // 산소캔 버튼 클릭 처리
  const handleOxygenButtonClick = () => {
    if (experimentPhase !== 'oxygenSupply') return

    setOxygenButtonActive(false)
    setExperimentPhase('oxygenSupplying')
    onPhaseChange('oxygenSupplying')

    playAnimation(2)
    playAnimation(4)

    timeoutRef.current = setTimeout(() => {
      setExperimentPhase('oxygenCanDisappearing')
      onPhaseChange('oxygenCanDisappearing')

      timeoutRef.current = setTimeout(() => {
        setExperimentPhase('cameraTrackOut')
        onPhaseChange('cameraTrackOut')

        const startPos = camera.position.clone()
        const targetPos = new THREE.Vector3(...EXPERIMENT_CONFIG.cameraPositions.trackOut)
        let progress = 0

        const trackOut = () => {
          progress += 0.02
          if (progress <= 1) {
            camera.position.lerpVectors(startPos, targetPos, progress)
            requestAnimationFrame(trackOut)
          } else {
            setExperimentPhase('readyToCover')
            onPhaseChange('readyToCover')
          }
        }
        trackOut()
      }, 1000)
    }, 3000)
  }

  const handleCoverCandles = () => {
    if (experimentPhase !== 'readyToCover') return

    setExperimentPhase('covering')
    onPhaseChange('covering')

    playAnimation(1)
    playAnimation(2)

    timeoutRef.current = setTimeout(() => {
      setExperimentPhase('burning')
      setShowFlame(true)
      onPhaseChange('burning')

      timeoutRef.current = setTimeout(() => {
        setExperimentPhase('rightOut')
        onPhaseChange('rightOut')

        // 임시: 더 짧은 페이드 시간으로 테스트
        let startTime = Date.now()
        const fadeDuration = 1000 // 1초로 단축

        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / fadeDuration, 1)
          const remaining = 1 - progress

          setRightFlameOpacity(remaining)
          setRightFlameScale(remaining)
          console.log(progress)

          if (progress == 1) {
            setExperimentPhase('finished')
            onPhaseChange('finished')
            onExperimentFinished()
          }
        }, 16)
      }, 1000)
    }, 1000)
  }
  const handleCoverFromParent = useCallback(() => {
    if (experimentPhase === 'readyToCover') {
      handleCoverCandles()
    }
  }, [experimentPhase])

  useEffect(() => {
    ;(window as any).handleCoverCandles = handleCoverFromParent
    return () => {
      delete (window as any).handleCoverCandles
    }
  }, [handleCoverFromParent])

  useEffect(() => {
    scene.traverse((child) => {
      if (child.name === 'Acryl_Cup') {
        rightCupRef.current = child
      } else if (child.name === 'Acryl_Cup1') {
        leftCupRef.current = child
      } else if (child.name === 'Oxygen_spray') {
        oxygenSprayRef.current = child
      } else if (child.name === 'Oxygen_spray_button') {
        oxygenButtonRef.current = child
      }

      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    scene.position.set(0, -1, 0)

    const handlePointerDown = (e: PointerEvent) => {
      const bounds = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
      const y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
      const pointer = new THREE.Vector2(x, y)

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)

      if (experimentPhase === 'selectingCup' && rightCupRef.current) {
        const hitRightCup = raycaster.intersectObject(rightCupRef.current, true).length > 0
        if (hitRightCup) {
          handleRightCupClick()
          return
        }
      }

      if (experimentPhase === 'oxygenSupply' && oxygenButtonRef.current) {
        const hitOxygenButton = raycaster.intersectObject(oxygenButtonRef.current, true).length > 0
        if (hitOxygenButton) {
          handleOxygenButtonClick()
          return
        }
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      const bounds = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
      const y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
      const pointer = new THREE.Vector2(x, y)

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)

      let shouldHover = false

      if (experimentPhase === 'selectingCup' && rightCupRef.current) {
        shouldHover = raycaster.intersectObject(rightCupRef.current, true).length > 0
      } else if (experimentPhase === 'oxygenSupply' && oxygenButtonRef.current) {
        shouldHover = raycaster.intersectObject(oxygenButtonRef.current, true).length > 0
      }

      setHovered(shouldHover)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [camera, gl, scene, experimentPhase])

  return (
    <group>
      <primitive object={scene} scale={5.0} position={[0, 0, 0]} />

      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={10} receiveShadow>
        <planeGeometry args={[64, 64]} />
        <meshStandardMaterial color='lightgray' />
      </mesh>

      <Environment preset='city' />
      {showFlame && (
        <>
          <Flame
            position={EXPERIMENT_CONFIG.flamePositions.right}
            opacity={rightFlameOpacity}
            scale={rightFlameScale}
          />
          <CandleLight position={EXPERIMENT_CONFIG.flamePositions.right} opacity={rightFlameOpacity} />

          <Flame position={EXPERIMENT_CONFIG.flamePositions.left} opacity={leftFlameOpacity} />
          <CandleLight position={EXPERIMENT_CONFIG.flamePositions.left} opacity={leftFlameOpacity} />
        </>
      )}

      <OrbitControls
        enabled={experimentPhase === 'waiting' || experimentPhase === 'selectingCup'}
        maxDistance={40}
        minDistance={3}
      />
    </group>
  )
}
