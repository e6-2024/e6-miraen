import React from 'react'
import { Html, useCursor } from '@react-three/drei'
import * as THREE from 'three'

interface SpeechBubbleProps {
  position: [number, number, number]
  html: HTMLDivElement['innerHTML'] | string
  // onPointClick?: () => void
  onBubbleClick?: () => void
  pointColor?: string
  pointSize?: number
  bubbleOffset?: [number, number, number]
}

export const SpeechBubble = ({ position, html, onBubbleClick, pointColor = '#ff6b6b', bubbleOffset = [0.2, 0.8, 0] }) => {
  return (
    <group position={position}>
      <Html prepend={true} transform={false} position={[bubbleOffset[0], bubbleOffset[1], bubbleOffset[2]]}>
        <div
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            borderColor: pointColor,
          }}
          className='bg-white p-3 font-bold rounded-xl shadow-xl border-2 relative cursor-pointer hover:scale-105 active:scale-95 transition-all'
          onClick={() => onBubbleClick?.()}
        >
          <div className='text-sm text-gray-800 whitespace-nowrap' dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </Html>
    </group>
  )
}