import * as S from './styles'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Cloud, Html, OrbitControls, OrthographicCamera, Preload, useProgress } from '@react-three/drei'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

const LoadingProgress = () => {
  const { progress, active, loaded, total } = useProgress()

  return (
    <S.SpinnerCover>
      <S.LoadingContainer>
        {/* 로컬 dotLottie 파일 사용 */}
        <S.LottieContainer>
          <DotLottieReact
            src="/animations/loading.lottie"
            loop
            autoplay
            // 로딩 실패 시 대체 콘텐츠
            renderConfig={{
              freezeOnOffscreen: false            
            }}
          />
        </S.LottieContainer>
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
        <S.LottieContainer>
          <DotLottieReact
            src="/animations/loading.lottie"
            loop
            autoplay
          />
        </S.LottieContainer>
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
              src="/animations/loading.lottie"
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
            src="/assets/animations/loading.lottie"
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

const LoadingProgressRandom = () => {
  const { progress, active, loaded, total } = useProgress()
  const [selectedAnimation, setSelectedAnimation] = useState('')

  useEffect(() => {
    // 여러 애니메이션 중 랜덤 선택
    const animations = [
      '/assets/animations/loading1.lottie',
      '/assets/animations/loading2.lottie',
      '/assets/animations/loading3.lottie',
    ]
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)]
    setSelectedAnimation(randomAnimation)
  }, [])

  return (
    <S.SpinnerCover>
      <S.LoadingContainer>
        <S.LottieContainer>
          <DotLottieReact
            src={selectedAnimation}
            loop
            autoplay
          />
        </S.LottieContainer>
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