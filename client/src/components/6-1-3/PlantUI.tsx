import React from 'react'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { CrayonTextButton } from '@/components/common/CrayonUIButton'

type ViewType = 'default' | 'root' | 'stem' | 'leaf' | 'water'
type InfoPanelType = 'root' | 'stem' | 'leaf'

interface SubtitleBoxProps {
  text: string
  isVisible: boolean
}

export function SubtitleBox({ text, isVisible }: SubtitleBoxProps) {
  if (!isVisible) return null

  return (
    <div className='absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none font-light'>
      <CrayonTextBox color='#F3921C' bg='#FFF'>
        {text}
      </CrayonTextBox>
    </div>
  )
}

interface InfoPanelProps {
  type: InfoPanelType
  isVisible: boolean
  onClose: () => void
}

export function InfoPanel({ type, isVisible, onClose }: InfoPanelProps) {
  const infoData = {
    root: {
      title: '뿌리',
      image: '/img/뿌리.png',
      description: '뿌리는 식물에 필요한 물을 흡수합니다.',
    },
    stem: {
      title: '줄기',
      image: '/img/줄기.png',
      description: '뿌리에서 흡수한 물은 줄기를 통해 잎으로 이동합니다.',
    },
    leaf: {
      title: '잎',
      image: '/img/잎.png',
      description: '잎에 도달한 물이 수증기가 되어 기공을 통해 잎 밖으로 빠져나갑니다.',
    },
  }

  const info = infoData[type]

  if (!isVisible || !info) return null

  return (
    <div className='absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4 z-50 border'>
      <div className='flex justify-between items-center mb-3'>
        <h3 className='text-lg font-bold text-gray-800'>{info.title}</h3>
        <button onClick={onClose} className='text-gray-500 hover:text-gray-700 text-xl'>
          ×
        </button>
      </div>
      <img src={info.image} alt={info.title} className='w-full h-full object-cover rounded mb-3' />
      <p className='text-sm text-gray-600 leading-relaxed'>{info.description}</p>
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
    <div className='absolute bottom-5 right-5'>
      <CrayonTextButton
        text='물의 이동 확인하기'
        width={200}
        bg='#52AE46'
        color='#A1CC90'
        textcolor='#FFFFFF'
        onClick={onClick}
      />
    </div>
  )
}

interface ViewControlsProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export function ViewControls({ currentView, onViewChange }: ViewControlsProps) {
  if (currentView !== 'default') {
    return (
      <div className='absolute top-4 left-4'>
        <CrayonTextButton
          text='전체 보기'
          width={128}
          bg='#F3921C'
          color='#FFDBB0'
          textcolor='#FFFFFF'
          onClick={() => onViewChange('default')}
        />
      </div>
    )
  }

  return null
}