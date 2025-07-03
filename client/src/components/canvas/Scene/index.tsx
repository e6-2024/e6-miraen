import * as S from './styles'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Cloud, Html, OrbitControls, OrthographicCamera, Preload, useProgress } from '@react-three/drei'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

// 로딩 프로그레스 컴포넌트 (로티 애니메이션 포함)
const LoadingProgress = () => {
  const { progress, active, loaded, total } = useProgress()

  return (
    <S.SpinnerCover>
      <S.LoadingContainer>
        {/* 로티 애니메이션 추가 */}
        <S.LottieContainer>
          <DotLottieReact
            src="https://lottie.host/ccf3930c-5aac-4b8b-8586-fcf219882a21/VVUV7mJFAl.lottie"
            loop
            autoplay
          />
        </S.LottieContainer>
        
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

// 대안 1: 로티만 사용하는 심플한 버전
const LoadingProgressSimple = () => {
  const { progress, active, loaded, total } = useProgress()

  return (
    <S.SpinnerCover>
      <S.LoadingContainer>
        <DotLottieReact
          src="https://lottie.host/ccf3930c-5aac-4b8b-8586-fcf219882a21/VVUV7mJFAl.lottie"
          loop
          autoplay
        />
        <S.LoadingText>Loading... {Math.round(progress)}%</S.LoadingText>
      </S.LoadingContainer>
    </S.SpinnerCover>
  )
}

// 대안 2: 프로그레스 바 위에 오버레이
const LoadingProgressWithOverlay = () => {
  const { progress, active, loaded, total } = useProgress()

  return (
    <S.SpinnerCover>
      <S.LoadingContainer>
        <S.LoadingText>Loading...</S.LoadingText>
        
        <S.ProgressWrapper>
          <S.ProgressBarContainer>
            <S.ProgressBar progress={progress} />
          </S.ProgressBarContainer>
          
          <S.LottieOverlay>
            <DotLottieReact
              src="https://lottie.host/ccf3930c-5aac-4b8b-8586-fcf219882a21/VVUV7mJFAl.lottie"
              loop
              autoplay
            />
          </S.LottieOverlay>
        </S.ProgressWrapper>
        
        <S.PercentageText>
          {Math.round(progress)}% ({loaded}/{total})
        </S.PercentageText>
      </S.LoadingContainer>
    </S.SpinnerCover>
  )
}

// 대안 3: 컴팩트한 가로 배치
const LoadingProgressCompact = () => {
  const { progress, active, loaded, total } = useProgress()

  return (
    <S.SpinnerCover>
      <S.LoadingContainer>
        <S.CompactWrapper>
          <DotLottieReact
            src="https://lottie.host/ccf3930c-5aac-4b8b-8586-fcf219882a21/VVUV7mJFAl.lottie"
            loop
            autoplay
          />
          
          <S.LoadingInfo>
            <S.LoadingText>Loading...</S.LoadingText>
            <S.ProgressBarContainer>
              <S.ProgressBar progress={progress} />
            </S.ProgressBarContainer>
            <S.PercentageText>
              {Math.round(progress)}%
            </S.PercentageText>
          </S.LoadingInfo>
        </S.CompactWrapper>
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