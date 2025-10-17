import React from 'react'
import { Html } from '@react-three/drei'
import { CrayonTextBox } from '../common/CrayonTextBox'
import { CrayonTextButton } from '../common/CrayonUIButton'

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
          <CrayonTextButton text={text} bg={'#fff'} color='#DFB2FA' textcolor='#222' width={120} height={60} className='text-base font-light text-white whitespace-nowrap' />
        </div>
      </Html>
    </group>
  )
}
