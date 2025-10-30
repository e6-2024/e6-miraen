import React from 'react'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'
import { usePlantAudio } from '@/hook/6-1-3/useAudio'

type ViewType = 'default' | 'root' | 'stem' | 'leaf' | 'water'
type InfoPanelType = 'root' | 'stem' | 'leaf'

interface SubtitleBoxProps {
  text: string
  isVisible: boolean
}

export function SubtitleBox({ text, isVisible }: SubtitleBoxProps) {
  if (!isVisible) return null
  return (
    <div className='absolute bottom-4 right-4 pointer-events-none font-light whitespace-pre-line'>
      <CrayonTextBox color='#F3921C' bg='#FFF' padding={40} paddingY={12}>
        {text}
      </CrayonTextBox>
    </div>
  )
}

interface WaterFlowButtonProps {
  isVisible: boolean
  onClick: () => void
}

export function WaterFlowButton({ isVisible, onClick }: WaterFlowButtonProps) {
  if (!isVisible) return null
  return (
    <div className='absolute top-32 right-4'>
      <CrayonTextButton
        text='뿌리에서 흡수된 물의 이동'
        width={340}
        bg='#05A8A4'
        color='#7BCACA'
        textcolor='#FFFFFF'
        onClick={onClick}
      />
    </div>
  )
}

interface ViewControlsProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  stopAll: () => void
}

export function ViewControls({ currentView, onViewChange, stopAll }: ViewControlsProps) {
  if (currentView !== 'default') {
    return (
      <div className='absolute top-4 left-4'>
        <CrayonTextButton
          text='첫 화면으로'
          bg='#F3921C'
          color='#FFDBB0'
          textcolor='#FFFFFF'
          onClick={() => {
            onViewChange('default')
            stopAll()
          }}
        />
      </div>
    )
  }
  return null
}

interface LeafAnimationProps {
  isVisible: boolean
  imagePath?: string
}

export function LeafAnimation({ isVisible, imagePath = '/img/evaporation.webp' }: LeafAnimationProps) {
  if (!isVisible) return null

  return (
    <div className='absolute right-8 top-1/2 -translate-y-1/2 z-50'>
      <CrayonTextBox bg='#FFFFFF' color='#05A8A4' className='shadow-2xl' padding={20} paddingY={20}>
        <img src={imagePath} alt='잎에서 물의 이동' className='w-[400px] h-auto rounded-lg' />
      </CrayonTextBox>
    </div>
  )
}

interface FullscreenEvaporationProps {
  isVisible: boolean
  onClose: () => void
  imagePath?: string
  autoCloseDuration?: number // ms
}

export function FullscreenEvaporation({
  isVisible,
  onClose,
  imagePath = '/img/evaporation.webp',
  autoCloseDuration = 5000,
}: FullscreenEvaporationProps) {
  React.useEffect(() => {
    if (!isVisible) return

    // 자동으로 닫기
    const timer = setTimeout(() => {
      onClose()
    }, autoCloseDuration)

    return () => clearTimeout(timer)
  }, [isVisible, onClose, autoCloseDuration])

  if (!isVisible) return null

  return (
    <div className='fixed inset-0 z-[1000] bg-black/80 flex items-center justify-center' onClick={onClose}>
      <CrayonTextBox padding={2} paddingY={2} color='#7BCACA' bg='#FFF'>
        <div className='absolute top-4 right-4 z-10'>
          <CrayonTextButton
            ariaLabel='닫기'
            icon='x'
            iconPosition='left'
            width={64}
            height={64}
            bg='#FF6B6B'
            color='#B63A3A'
            textcolor='#FFFFFF'
            className='active:scale-90 transition-all duration-300'
            onClick={onClose}
            innerCircleVisible={false}
          />
        </div>
        <div className='relative w-full h-full flex items-center justify-center p-8'>
          <img
            src={imagePath}
            alt='잎에서 물의 증발'
            className='max-w-full max-h-full object-contain'
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </CrayonTextBox>
    </div>
  )
}
