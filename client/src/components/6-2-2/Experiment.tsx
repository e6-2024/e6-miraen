// Experiment.tsx

import { useEffect, useRef, useState } from 'react'
import { useGLTF, useCursor, Environment } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import CandleLight from './CandleLight'
import Flame from './Flame'

interface ExperimentProps {
  setUiText: (text: string) => void
  lightCandle: boolean
  setLightCandle: (value: boolean) => void
}

export default function Experiment({ setUiText, lightCandle, setLightCandle }: ExperimentProps) {
  const { scene } = useGLTF('/models/6-2-2/candle.gltf')
  const { camera, gl } = useThree()

  // 촛불 참조들
  const rightCandleRef = useRef<THREE.Object3D>(null)
  const leftCandleRef = useRef<THREE.Object3D>(null)

  // 촛불 상태
  const [showFlame, setShowFlame] = useState(false)
  const [leftFlameOpacity, setLeftFlameOpacity] = useState(1)
  const [rightFlameOpacity, setRightFlameOpacity] = useState(1)
  const [rightFlameScale, setRightFlameScale] = useState(1)

  const [hovered, setHovered] = useState(false)
  useCursor(hovered)

  // 타이머 참조 추가 (정리용)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // lightCandle이 false로 변경될 때 상태 초기화
  useEffect(() => {
    if (!lightCandle) {
      // 모든 타이머 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      // 상태 초기화
      setShowFlame(false)
      setLeftFlameOpacity(1)
      setRightFlameOpacity(1)
      setRightFlameScale(1)
    }
  }, [lightCandle])

  // 버튼으로 촛불 켜기
  useEffect(() => {
    if (lightCandle && !showFlame) {
      setShowFlame(true)
      setLeftFlameOpacity(1)
      setRightFlameOpacity(1)
      setRightFlameScale(1)
      setUiText('촛불이 켜졌습니다! 2초 후 오른쪽 촛불이 사라집니다.')
      
      timeoutRef.current = setTimeout(() => {
        let startTime = Date.now()
        const fadeDuration = 2000
        
        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / fadeDuration, 1)
          const remaining = 1 - progress
          
          setRightFlameOpacity(remaining)
          setRightFlameScale(remaining) // scale도 함께 줄이기
          
          if (progress >= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            setUiText('왼쪽 촛불이 꺼졌습니다!')
          }
        }, 16)
      }, 2000)
    }
  }, [lightCandle, showFlame, setUiText])

  useEffect(() => {
    console.log('Scene children:', scene.children.length)
    
    // 아무것도 제거하지 않고 원본 인덱스로 촛불 참조
    rightCandleRef.current = scene.children[3]  // 원본 인덱스
    leftCandleRef.current = scene.children[4]   // 원본 인덱스

    console.log('rightCandle:', rightCandleRef.current)
    console.log('leftCandle:', leftCandleRef.current)

    // 모든 mesh에 그림자 설정 적용
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    scene.position.set(0, -1, 0)

    // 초기 메시지
    setUiText('버튼을 클릭해서 촛불을 켜보세요!')

    const handleDown = (e: PointerEvent) => {
      const bounds = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
      const y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
      const pointer = new THREE.Vector2(x, y)

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)

      // 촛불 클릭 감지 (오른쪽 촛불이 보일 때만)
      const hitLC = leftCandleRef.current && raycaster.intersectObject(leftCandleRef.current, true).length > 0
      const hitRC = rightCandleRef.current && raycaster.intersectObject(rightCandleRef.current, true).length > 0

      if (hitLC || hitRC) {
        if (showFlame) {
          // 촛불 끄기 (서서히)
          setUiText('촛불이 꺼지고 있습니다...')
          setLightCandle(false)
          
          // 왼쪽 촛불 서서히 끄기
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

          // 오른쪽 촛불도 조금 늦게 서서히 끄기
          setTimeout(() => {
            const rightFadeInterval = setInterval(() => {
              setRightFlameOpacity(prev => {
                const newOpacity = prev - 0.02
                if (newOpacity <= 0) {
                  clearInterval(rightFadeInterval)
                  setShowFlame(false)
                  setUiText('촛불이 꺼졌습니다. 버튼을 클릭해서 다시 켜보세요!')
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
      // 호버 효과를 위한 레이캐스팅
      const bounds = gl.domElement.getBoundingClientRect()
      const x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1
      const y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1
      const pointer = new THREE.Vector2(x, y)

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)

      // 촛불 클릭 감지 (rightCandleVisible 조건 제거)
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
  }, [camera, gl, scene, showFlame, setLightCandle, setUiText])

  return (
    <group>
      <primitive object={scene} scale={5.0} position={[0, 0, 0]} />

      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI/2, 0, 0]} scale={10} receiveShadow>
        <planeGeometry args={[64, 64]} />
        <meshStandardMaterial color="lightgray" />
      </mesh>
      
      <Environment preset='city'/>
      
      {showFlame && (
        <>
          <Flame position={[0.41, -0.9, 0]} opacity={rightFlameOpacity}/>
          <CandleLight position={[0.41, -0.9, 0]} opacity={rightFlameOpacity} />
          {/* 왼쪽 촛불 */}
          <Flame position={[-0.57, -0.9, 0]} opacity={leftFlameOpacity} scale={rightFlameScale}/>
          <CandleLight position={[-0.57, -0.9, 0]} opacity={leftFlameOpacity} />
        </>
      )}
    </group>
  )
}