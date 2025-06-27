import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import AnimatedModel from '../components/AnimatedModel'
import { useState, useEffect } from 'react'
import {Model} from '@/components/5-1-4-2/Model'


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

  // 모델 사전 로딩
  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true)
      
      console.log('Preloading models...')
      
      // 모든 모델 URL 사전 로딩
      for (const url of allPreloadUrls) {
        useGLTF.preload(url)
        // 약간의 지연을 추가하여 브라우저가 무응답 상태가 되지 않도록 함
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      console.log('All models preloaded!')
      setIsLoading(false)
    }
    
    loadModels()
    
    // 컴포넌트 언마운트 시 캐시 정리 (선택 사항)
    return () => {
      allPreloadUrls.forEach(url => useGLTF.clear(url))
    }
  }, [])

  // 실제 로드할 모델 키 (bone도 muscle 로드)
  const getModelKey = () => {
    // 기본 모델 타입 결정 (bone은 muscle 기반)
    let base
    if (modelType === 'bone') {
      base = 'Muscle'
    } else {
      base = modelType.charAt(0).toUpperCase() + modelType.slice(1)
    }
    
    // 애니메이션 상태에 따른 접미사
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
    Boy_Walking: 1,
    Boy_Pose: 0,
    Muscle_Walking: 1,
    Muscle_Pose: 0
  }



  const getModelScale = () => {
    return 0.5;
  }

  // 위치도 필요하다면 조정 가능
  const getModelPosition = (): [number, number, number] => {
    return [0, -0.2, 0];
  }

  const animIndex = animIndexMap[modelKey] ?? 0

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
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
      
      <Canvas shadows camera={{ position: [0, 0.2, 0.4], fov: 75 }} style={{ width: '100%', height: '100%' }}>
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
        <Model/>

        <OrbitControls minDistance={0.23} maxDistance={0.53} />
      </Canvas>

      {/* UI */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          padding: '10px',
          borderRadius: '8px',
        }}>
        {/* 애니메이션 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {['walk', 'pose'].map((state) => (
            <button
              key={state}
              onClick={() => setAnimState(state as AnimationState)}
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
          {(['boy', 'muscle', 'bone'] as ModelType[]).map((type) => (
            <button
              key={type}
              onClick={() => setModelType(type)}
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
              {type === 'boy' ? '피부' : 
               type === 'muscle' ? '근육' : 
               type === 'bone' ? '뼈' : '장기'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}