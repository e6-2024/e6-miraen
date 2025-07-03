import * as S from './styles'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Cloud, Html, OrbitControls, OrthographicCamera, Preload, useProgress } from '@react-three/drei'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

// 방법 1: 절대 경로 사용 (추천)
const LoadingProgressSimple = () => {
  const { progress, active, loaded, total } = useProgress()
  const [lottieError, setLottieError] = useState(false)
  const [lottieLoaded, setLottieLoaded] = useState(false)

  // 배포 환경에 맞는 경로 설정
  const getLottiePath = () => {
    // Vercel, Netlify 등 배포 환경에서는 절대 경로 사용
    const basePath = process.env.NODE_ENV === 'production' 
      ? `${window.location.origin}/animations/loading.lottie`
      : '/animations/loading.lottie'
    
    return basePath
  }

  // 파일 존재 여부 체크
  useEffect(() => {
    const checkFile = async () => {
      try {
        const response = await fetch(getLottiePath(), { method: 'HEAD' })
        if (!response.ok) {
          setLottieError(true)
        }
      } catch (error) {
        console.error('Lottie file not accessible:', error)
        setLottieError(true)
      }
    }
    
    checkFile()
  }, [])

  return (
    <S.SpinnerCover>
      <S.LoadingContainer>
        <S.LottieContainer>
          {!lottieError ? (
            <DotLottieReact
              src={getLottiePath()}
              loop
              autoplay
              style={{
                width: '100%',
                height: '100%',
              }}
            />
          ) : (
            <S.FallbackSpinner />
          )}
        </S.LottieContainer>
        <S.LoadingText>Loading... {Math.round(progress)}%</S.LoadingText>
      </S.LoadingContainer>
    </S.SpinnerCover>
  )
}


const Scene = ({ children, ...props }) => {
  const canvasRef = useRef()
  return (
    <>
      <Canvas {...props} ref={canvasRef} {...props} shadows>
        <Suspense
          fallback={
            <Html center>
              <LoadingProgressSimple />
            </Html>
          }>
          {children}
          <Preload all />
        </Suspense>
      </Canvas>
    </>
  )
}

export default Scene