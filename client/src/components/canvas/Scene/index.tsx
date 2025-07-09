import * as S from './styles'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Cloud, Html, OrbitControls, OrthographicCamera, Preload, useProgress } from '@react-three/drei'
import Lottie from 'react-lottie-player'
import lottieJson from '../../../../public/animations/loading.json'

const LoadingProgressSimple = () => {
  const { progress, active, loaded, total } = useProgress()
  const [lottieError, setLottieError] = useState(false)
  const [lottieLoaded, setLottieLoaded] = useState(false)

 
  return (
    <S.SpinnerCover>
      <S.LoadingContainer>
        <S.LottieContainer>
          {!lottieError ? (
            <Lottie loop animationData={lottieJson} play goTo={150}/>
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
            <Html center >
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