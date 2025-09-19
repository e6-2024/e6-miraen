import { useEffect, useRef, useState } from 'react'
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
}

export function CandleExperiment({ 
  experimentStarted, 
  experimentFinished,
  onExperimentFinished 
}: CandleExperimentProps) {
  const { scene } = useGLTF('/models/6-2-2/Whole_Scene.glb')
  const { camera, gl } = useThree()

  const rightCandleRef = useRef<THREE.Object3D>(null)
  const leftCandleRef = useRef<THREE.Object3D>(null)

  const [showFlame, setShowFlame] = useState(false)
  const [leftFlameOpacity, setLeftFlameOpacity] = useState(1)
  const [rightFlameOpacity, setRightFlameOpacity] = useState(1)
  const [rightFlameScale, setRightFlameScale] = useState(1)
  const [hovered, setHovered] = useState(false)
  const [experimentPhase, setExperimentPhase] = useState<ExperimentPhase>('waiting')

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useCursor(hovered)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (!experimentStarted) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      setShowFlame(false)
      setLeftFlameOpacity(1)
      setRightFlameOpacity(1)
      setRightFlameScale(1)
      setExperimentPhase('waiting')
    }
  }, [experimentStarted])

  useEffect(() => {
    if (experimentStarted && !showFlame && experimentPhase === 'waiting') {
      setShowFlame(true)
      setLeftFlameOpacity(1)
      setRightFlameOpacity(1)
      setRightFlameScale(1)
      setExperimentPhase('burning')
      
      timeoutRef.current = setTimeout(() => {
        setExperimentPhase('rightOut')
        let startTime = Date.now()
        const fadeDuration = EXPERIMENT_CONFIG.fadeDuration
        
        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / fadeDuration, 1)
          const remaining = 1 - progress
          
          setRightFlameOpacity(remaining)
          setRightFlameScale(remaining)
          
          if (progress >= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            setExperimentPhase('finished')
            onExperimentFinished()
          }
        }, 16)
      }, EXPERIMENT_CONFIG.burnDuration)
    }
  }, [experimentStarted, showFlame, experimentPhase, onExperimentFinished])

  useEffect(() => {
    rightCandleRef.current = scene.children[3]
    leftCandleRef.current = scene.children[4]

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    scene.position.set(0, -1, 0)

    const handleDown = (e: PointerEvent) => {
      if (!experimentStarted || experimentPhase !== 'burning') return

      const bounds = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
      const y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
      const pointer = new THREE.Vector2(x, y)

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)

      const hitLC = leftCandleRef.current && raycaster.intersectObject(leftCandleRef.current, true).length > 0
      const hitRC = rightCandleRef.current && raycaster.intersectObject(rightCandleRef.current, true).length > 0

      if (hitLC || hitRC) {
        if (showFlame) {
          const leftFadeInterval = setInterval(() => {
            setLeftFlameOpacity(prev => {
              const newOpacity = prev - 0.02
              if (newOpacity <= 0) {
                clearInterval(leftFadeInterval)
                return 0
              }
              return newOpacity
            })
          }, 100)

          setTimeout(() => {
            const rightFadeInterval = setInterval(() => {
              setRightFlameOpacity(prev => {
                const newOpacity = prev - 0.02
                if (newOpacity <= 0) {
                  clearInterval(rightFadeInterval)
                  setShowFlame(false)
                  return 0
                }
                return newOpacity
              })
            }, 100)
          }, 1000)
        }
      }
    }

    const handleMove = (e: PointerEvent) => {
      const bounds = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
      const y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
      const pointer = new THREE.Vector2(x, y)

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)

      const hitLC = leftCandleRef.current && raycaster.intersectObject(leftCandleRef.current, true).length > 0
      const hitRC = rightCandleRef.current && raycaster.intersectObject(rightCandleRef.current, true).length > 0

      setHovered(hitLC || hitRC)
    }

    window.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointermove', handleMove)

    return () => {
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointermove', handleMove)
    }
  }, [camera, gl, scene, showFlame, experimentStarted, experimentPhase])



  return (
    <group>
      <primitive object={scene} scale={5.0} position={[0, 0, 0]} />

      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI/2, 0, 0]} scale={10} receiveShadow>
        <planeGeometry args={[64, 64]} />
        <meshStandardMaterial color="lightgray" />
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
          
          <Flame 
            position={EXPERIMENT_CONFIG.flamePositions.left} 
            opacity={leftFlameOpacity} 
          />
          <CandleLight position={EXPERIMENT_CONFIG.flamePositions.left} opacity={leftFlameOpacity} />
        </>
      )}

      <OrbitControls
        enabled={!experimentStarted}
        maxDistance={30}
        minDistance={3}
      />
    </group>
  )
}