import { Canvas } from '@react-three/fiber'
import { OrbitControls, AccumulativeShadows, RandomizedLight, Environment, PerformanceMonitor } from '@react-three/drei'
import AnimatedModel2 from '../components/AnimatedModel2'
import { useState, useRef, useEffect } from 'react'
import { Model } from '@/components/5-1-4-2/Model'
import Link from 'next/link'
import Scene from '@/components/canvas/Scene'

export default function Home() {
  const [action, setAction] = useState<'extend' | 'fold'>('fold')
  const [perfSucks, degrade] = useState(false)
  
  // 나레이션 관련 상태
  const [currentNarration, setCurrentNarration] = useState<HTMLAudioElement | null>(null)
  const [showNarrationText, setShowNarrationText] = useState(false)
  const [narrationText, setNarrationText] = useState('')

  const [lineTargetPosA, setLineTargetPosA] = useState<[number, number, number]>([-0.035, 0.001, -0.015])
  const [lineTargetPosB, setLineTargetPosB] = useState<[number, number, number]>([-0.035, 0.001, -0.015])
  const [hasExtended, setHasExtended] = useState(false)

  // 나레이션 재생 함수
  const playNarration = (audioPath: string, text: string) => {
    // 기존 나레이션 정지
    if (currentNarration) {
      currentNarration.pause()
      currentNarration.currentTime = 0
    }

    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      
      audio.play().catch(error => {
        console.log('나레이션 재생 실패:', error.name)
      })
      
      setCurrentNarration(audio)
      
      // 나레이션 종료 시 텍스트 숨김
      audio.addEventListener('ended', () => {
        setShowNarrationText(false)
        setNarrationText('')
        setCurrentNarration(null)
      })
      
    } catch (error) {
      console.log('나레이션 생성 실패:', error)
    }
  }

  const playClickSound = (audioPath: string = '/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3') => {
    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.3
      audio.play().catch(error => {
        console.log('효과음 재생 실패:', error.name)
      })
    } catch (error) {
      console.log('효과음 생성 실패:', error)
    }
  }

  const handleExtend = () => {
    playClickSound()
    setAction('extend')

    if (!hasExtended) {
      setLineTargetPosA(([x, y, z]) => [x, y, z+0.001] as [number, number, number])
      setLineTargetPosB(([x, y, z]) => [x, y, z+0.005] as [number, number, number])
      setHasExtended(true)
    }

    playNarration(
      '/sounds/5-1-4/5-1-4-E.MP3',
      '팔을 구부릴 때 팔 바깥쪽 근육이 늘어나고 팔 안쪽 근육이 줄어듭니다. 근육이 서로 반대로 작용하여 팔이 움직입니다.'
    )
  }

  const handleFold = () => {
    playClickSound()
    setAction('fold')
    setLineTargetPosA([-0.035, 0.001, -0.015])
    setLineTargetPosB([-0.035, 0.001, -0.015])
    setHasExtended(false)

    playNarration(
      '/sounds/5-1-4/5-1-4-D.MP3',
      '팔을 펼 때 팔 바깥쪽 근육이 줄어들고 팔 안쪽 근육이 늘어납니다. 이렇게 근육이 협력하여 팔의 움직임을 만들어냅니다.'
    )
  }

  return (
    <>
      <Scene
        shadows 
        camera={{ position: [-0.1, 0.1, 0.4], fov: 50 }} 
        style={{ width: '100vw', height: '100vh' }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={1.0 * Math.PI} />
        <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />

        <PerformanceMonitor onDecline={() => degrade(true)} />

        <AnimatedModel2
          url="/models/Anatomy/Arm/Flexing.glb"
          actionName={action}
          scale={1.5}
          position={[0, -0.375, 0]}
        />

        <OrbitControls 
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
          minPolarAngle={Math.PI / 3 + Math.PI / 10}
          maxPolarAngle={Math.PI / 2}
          minDistance={0.1} 
          maxDistance={0.7}
        />
        
      </Scene>
      
      <div className='absolute top-2 left-2 font-light'>
        <Link href="/5-1-4">
          <button className="px-4 py-2 bg-white-500 text-black rounded hover:bg-black hover:text-white">
            되돌아가기
          </button>
        </Link>
      </div>

      <div className='absolute flex top-2 right-2 gap-[5px] flex-col font-light'>
        <button
          onClick={handleFold}
          style={{
            backgroundColor: 'black',
            color: 'white',
            fontSize: '16px',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '10px',
          }}>
          팔을 펼 때
        </button>
        <button
          onClick={handleExtend}
          style={{
            backgroundColor: 'black',
            color: 'white',
            fontSize: '16px',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '10px',
          }}>
          팔을 구부릴 때
        </button>
      </div>
    </>
  )
}