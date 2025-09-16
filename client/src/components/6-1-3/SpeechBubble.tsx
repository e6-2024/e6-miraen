import React from 'react'
import { Html } from '@react-three/drei'
import { CrayonTextBox } from '../common/CrayonTextBox'

interface SpeechBubbleProps {
  position: [number, number, number]
  text?: string
  onBubbleClick?: () => void
  pointColor?: string
  pointSize?: number
  bubbleOffset?: [number, number, number]
}

export const SpeechBubble = ({
  position,
  text = '',
  onBubbleClick,
  pointColor = '#ff6b6b',
  bubbleOffset = [0.2, 0.8, 0],
}: SpeechBubbleProps) => {
  return (
    <group position={position}>
      <Html prepend={true} transform={false} position={bubbleOffset}>
        <div onClick={() => onBubbleClick?.()} className='cursor-pointer'>
          <CrayonTextBox text={text} animated={true} bg={'#fff'} color='#FFDBB0' textcolor='#222' width={100} height={60} fontSize={'16px'} className='text-sm font-light text-white whitespace-nowrap' />
        </div>
      </Html>
    </group>
  )
}
