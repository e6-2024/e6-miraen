import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import AnimatedModel from '../components/AnimatedModel'
import { useState, useEffect, useRef } from 'react'
import {Model} from '@/components/5-1-4-2/Model'
import Link from 'next/link'

type ModelType = 'boy' | 'muscle' | 'bone'
type AnimationState = 'walk' | 'pose'

// 모든 가능한 모델 URL을 미리 계산
const preloadModelUrls = [
  '/models/Anatomy/Boy_Walking.gltf',
  '/models/Anatomy/Boy_Pose.gltf',
  '/models/Anatomy/Muscle_Walking.gltf',
  '/models/Anatomy/Muscle_Pose.gltf'
]

// 각 URL에 대해 bone 버전도 캐시 키 추가
const allPreloadUrls = [
  ...preloadModelUrls,
  ...preloadModelUrls.map(url => `${url}#bone`)
]

export default function Home() {
  const [modelType, setModelType] = useState<ModelType>('boy')
  const [animState, setAnimState] = useState<AnimationState>('pose')
  const [isLoading, setIsLoading] = useState(true)
  
  // 나레이션 관련 상태
  const [currentNarration, setCurrentNarration] = useState<HTMLAudioElement | null>(null)
  const [showNarrationText, setShowNarrationText] = useState(false)
  const [narrationText, setNarrationText] = useState<string[]>([])

  // 모델 사전 로딩
  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true)
      
      console.log('Preloading models...')
      
      // 모든 모델 URL 사전 로딩
      for (const url of allPreloadUrls) {
        useGLTF.preload(url)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      console.log('All models preloaded!')
      setIsLoading(false)
    }
    
    loadModels()
    
    return () => {
      allPreloadUrls.forEach(url => useGLTF.clear(url))
    }
  }, [])

  // 나레이션 재생 함수
  const playNarration = (audioPath: string, text: string[]) => {
    // 기존 나레이션 정지
    if (currentNarration) {
      currentNarration.pause()
      currentNarration.currentTime = 0
    }

    try {
      const audio = new Audio(audioPath)
      audio.volume = 0.7
      
      setNarrationText(text)
      setShowNarrationText(true)
      
      audio.play().catch(error => {
        console.log('나레이션 재생 실패:', error.name)
      })
      
      setCurrentNarration(audio)
      
      // 나레이션 종료 시 텍스트 숨김
      audio.addEventListener('ended', () => {
        setShowNarrationText(false)
        setNarrationText([])
        setCurrentNarration(null)
      })
      
    } catch (error) {
      console.log('나레이션 생성 실패:', error)
    }
  }

  // 나레이션 정지 함수
  const stopNarration = () => {
    if (currentNarration) {
      currentNarration.pause()
      currentNarration.currentTime = 0
      setCurrentNarration(null)
    }
    setShowNarrationText(false)
    setNarrationText([])
  }

  // 효과음 재생 함수
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

  const handleAnimationChange = (newAnimState: AnimationState) => {
    playClickSound()
    setAnimState(newAnimState)
    
    if (newAnimState === 'walk') {
      let audioPath = ''
      let text
      
      switch (modelType) {
        case 'boy':
          audioPath = '/sounds/5-1-4/5-1-4-A.MP3'
          text = ['우리 몸은 뼈와 근육의 작용으로 움직입니다.']
          break
        case 'bone':
          audioPath = '/sounds/5-1-4/5-1-4-B.MP3'
          text = ['우리 몸속의 뼈는 모양과 크기가 다양합니다.','뼈는 우리 몸의 형태를 만들고 몸을 지탱하며, 몸속에 있는 여러 기관을 보호합니다.']
          break
        case 'muscle':
          audioPath = '/sounds/5-1-4/5-1-4-C.MP3'
          text = ['우리 몸속의 근육은 모양과 크기가 다양합니다.','근육은 뼈에 연결되어 있으며 뼈를 움직이게 합니다.']
          break
      }
      
      if (audioPath) {
        playNarration(audioPath, text)
      }
    } else {
      stopNarration()
    }
  }

  const handleModelTypeChange = (type: ModelType) => {
  playClickSound()
  setModelType(type)
  stopNarration()
  
  // 현재 애니메이션이 'walk'일 때만 나레이션 재생
  if (animState === 'walk') {
    let audioPath = ''
    let text
    
    switch (type) {
      case 'boy':
        audioPath = '/sounds/5-1-4/5-1-4-A.MP3'
        text = ['우리 몸은 뼈와 근육의 작용으로 움직입니다.']
        break
      case 'bone':
        audioPath = '/sounds/5-1-4/5-1-4-B.MP3'
        text = ['우리 몸속의 뼈는 모양과 크기가 다양합니다.','뼈는 우리 몸의 형태를 만들고 몸을 지탱하며, 몸속에 있는 여러 기관을 보호합니다.']
        break
      case 'muscle':
        audioPath = '/sounds/5-1-4/5-1-4-C.MP3'
        text = ['우리 몸속의 근육은 모양과 크기가 다양합니다.','근육은 뼈에 연결되어 있으며 뼈를 움직이게 합니다.']
        break
    }
    
    if (audioPath) {
      playNarration(audioPath, text)
    }
  }
}

  const getModelKey = () => {
    let base
    if (modelType === 'bone') {
      base = 'Muscle'
    } else {
      base = modelType.charAt(0).toUpperCase() + modelType.slice(1)
    }
    
    const anim = animState === 'walk' ? 'Walking' : 'Pose'
    
    return `${base}_${anim}`
  }

  const modelKey = getModelKey()
  
  const getModelUrl = () => {{
      return `/models/Anatomy/${modelKey}.gltf`
    }
  }
  
  const modelUrl = getModelUrl()
  const lightIntensity = modelType === 'boy' ? 1.0 : 3.0

  // 애니메이션 인덱스 (필요하면 정확하게 설정)
  const animIndexMap: Record<string, number> = {
    Boy_Walking: 0,
    Boy_Pose: 0,
    Muscle_Walking: 1,
    Muscle_Pose: 0
  }

  // 모델 타입별 스케일 설정
  const getModelScale = () => {
    switch (modelType) {
      case 'boy':
        return 0.6;      // 피부 모델 스케일
      case 'muscle':
        return 0.006;     // 근육 모델 스케일 (조금 더 크게)
      case 'bone':
        return 0.006;     // 뼈 모델 스케일 (조금 더 작게 )
      default:
        return 0.1;
    }
  }

  // 위치도 필요하다면 조정 가능
  const getModelPosition = (): [number, number, number] => {
    return [0, -0.208, 0];
  }

  const animIndex = animIndexMap[modelKey] ?? 0

  return (
    <div className='w-full h-full relative font-light'>
      {/* 로딩 인디케이터 */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          fontSize: '24px',
          zIndex: 1000
        }}>
          모델 로딩 중... 잠시만 기다려주세요.
        </div>
      )}

      {showNarrationText && animState === 'walk' && (
        <ol style={{
          position: 'absolute',
          top: '60px',
          left: '10px',
          backgroundColor: 'white',
          color: 'black',
          padding: '10px 20px',
          border:'1px solid black',
          fontSize: '18px',
          maxWidth: '80%',
          textAlign: 'left',
          zIndex: 1000,
          lineHeight: '1.5'
        }}>
          {narrationText.map((line,index) => (
            <li key={index}>{line}</li>
          ))}
        </ol>
      )}
      
      <Canvas shadows camera={{ position: [0, 0.3, 0.8], fov: 75 }} style={{ width: '100%', height: '100%' }}>
      <fog attach="fog" args={['#f0f0f0', 0.3, 0.9]} />
        <ambientLight intensity={2.0} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
          <planeGeometry args={[5, 5]} />
          <shadowMaterial opacity={0.4} />
        </mesh>

        <directionalLight
          position={[-0.8, 0.2, 0.3]} // 왼쪽 위에서 비추는 느낌
          intensity={0.8}
          color="#B388EB" // 연보라
        />

        <directionalLight
          position={[0.8, 0.2, 0.3]} // 오른쪽 위에서 비추는 느낌
          intensity={0.8}
          color="#FF8DC7" // 핑크
        />

        <directionalLight
          position={[0, 5, 3]}
          intensity={lightIntensity}
          castShadow
          receiveShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.1}
          shadow-camera-far={10}
          shadow-camera-left={-1}
          shadow-camera-right={1}
          shadow-camera-top={1}
          shadow-camera-bottom={-1}
        />

        {!isLoading && (
          <AnimatedModel
            key={`${modelUrl}-${modelType}-${animState}`}
            url={modelUrl}
            animIndex={animIndex}
            scale={getModelScale()}
            position={getModelPosition()}
            loop={true}
            removeMuscleLayer={modelType === 'bone'} // bone일 때만 muscle 레이어 제거
          />
        )}

        <OrbitControls 
          minDistance={0.23} 
          maxDistance={0.53} 
          maxPolarAngle={Math.PI/2}
        />
      </Canvas>

      <div className='absolute top-2 left-2'>
        <Link href="/5-1-4">
          <button className="px-4 py-2 bg-white-500 text-black rounded hover:bg-black hover:text-white">
            되돌아가기
          </button>
        </Link>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '0%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          padding: '10px',
          borderRadius: '8px',
        }}>
        {/* 애니메이션 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {['pose', 'walk'].map((state) => (
            <button
              key={state}
              onClick={() => handleAnimationChange(state as AnimationState)}
              style={{
                padding: '8px 16px',
                backgroundColor: animState === state ? '#4CAF50' : '#f1f1f1',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: isLoading ? 0.5 : 1,
              }}
              disabled={isLoading}
            >
              {state === 'walk' ? '걷기' : '정지'}
            </button>
          ))}
        </div>

        {/* 모델 타입 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {(['boy', 'bone', 'muscle'] as ModelType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleModelTypeChange(type)}
              style={{
                width: '60px',
                height: '60px',
                backgroundColor: modelType === type ? '#2196F3' : '#f1f1f1',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                opacity: isLoading ? 0.5 : 1,
                fontSize: '14px',
              }}
              disabled={isLoading}
            >
              {type === 'boy' ? '겉모습' : 
               type === 'muscle' ? '근육' : 
               type === 'bone' ? '뼈' : ''}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}