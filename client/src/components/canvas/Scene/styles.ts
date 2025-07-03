import styled, { keyframes } from 'styled-components'
import tw from 'twin.macro'

export const SpinnerCover = styled.div`
  ${tw`
    fixed
    inset-0
    flex
    justify-center
    items-center
    z-50
  `}
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
`

export const LoadingContainer = styled.div`
  ${tw`
    flex
    flex-col
    items-center
    gap-4
  `}
`

export const LottieContainer = styled.div`
  ${tw`
    w-64
    h-64
    mb-4
    flex
    justify-center
    items-center
  `}
`

// 프로그레스 바와 로티 애니메이션을 함께 표시하는 래퍼
export const ProgressWrapper = styled.div`
  ${tw`
    relative
    w-full
    my-4
  `}
`

// 로티 애니메이션 오버레이 - 크기 증가
export const LottieOverlay = styled.div`
  ${tw`
    absolute
    top-1/2
    left-1/2
    transform
    -translate-x-1/2
    -translate-y-1/2
    pointer-events-none
    z-10
    w-24
    h-24
  `}
`

// 컴팩트한 로딩 UI를 위한 스타일 - 크기 증가
export const CompactWrapper = styled.div`
  ${tw`
    flex
    items-center
    gap-5
    md:flex-row
    flex-col
    md:gap-5
    gap-4
  `}
  
  > div:first-child {
    ${tw`w-32 h-32`}
  }
`

export const LoadingInfo = styled.div`
  ${tw`
    flex
    flex-col
    items-center
    min-w-[200px]
  `}
`

export const LoadingText = styled.div`
  ${tw`
    text-lg
    font-medium
  `}
  color: #374151;
`

export const ProgressBarContainer = styled.div`
  ${tw`
    w-64
    h-2
    rounded-full
    overflow-hidden
    md:w-64
    w-60
  `}
  background-color: rgba(0, 0, 0, 0.1);
`

export const ProgressBar = styled.div<{ progress: number }>`
  ${tw`
    h-full
    rounded-full
    transition-all
    duration-300
    ease-out
  `}
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  width: ${(props) => props.progress}%;
`

export const PercentageText = styled.div`
  ${tw`
    text-sm
    font-mono
    text-center
  `}
  color: #6b7280;
`

// 로티 로딩 실패 시 사용할 CSS 스피너 애니메이션
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

export const FallbackSpinner = styled.div`
  ${tw`
    w-16
    h-16
    border-4
    border-blue-200
    rounded-full
  `}
  border-top-color: #3b82f6;
  animation: ${spin} 1s ease-in-out infinite;
`