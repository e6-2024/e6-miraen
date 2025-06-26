import styled from 'styled-components'
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
  `}
  background-color: rgba(0, 0, 0, 0.1);
`

export const ProgressBar = styled.div`
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
  `}
  color: #6b7280;
`
