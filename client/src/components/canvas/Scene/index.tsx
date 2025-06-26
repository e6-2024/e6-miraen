import * as S from './styles'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Cloud, Html, OrbitControls, OrthographicCamera, Preload, useProgress } from '@react-three/drei'

// 로딩 프로그레스 컴포넌트
const LoadingProgress = () => {
  const { progress, active, loaded, total } = useProgress()

  return (
    <S.SpinnerCover>
      <S.LoadingContainer>
        <S.LoadingText>Loading...</S.LoadingText>
        <S.ProgressBarContainer>
          <S.ProgressBar progress={progress} />
        </S.ProgressBarContainer>
        <S.PercentageText>
          {Math.round(progress)}% ({loaded}/{total})
        </S.PercentageText>
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
              <LoadingProgress />
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
