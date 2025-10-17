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
    <div className='absolute bottom-4 right-4 pointer-events-none font-light'>
      <CrayonTextBox color='#F3921C' bg='#FFF'>{text}</CrayonTextBox>
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
        width={240}
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
  stopAll: () => void         // <- 추가
}

export function ViewControls({ currentView, onViewChange, stopAll }: ViewControlsProps) {
  if (currentView !== 'default') {
    return (
      <div className='absolute top-4 left-4'>
        <CrayonTextButton
          text='이전으로 돌아가기'
          width={180}
          bg='#F3921C'
          color='#FFDBB0'
          textcolor='#FFFFFF'
          onClick={() => {
            onViewChange('default')
            stopAll() // 같은 인스턴스의 오디오가 멈춤
          }}
        />
      </div>
    )
  }
  return null
}