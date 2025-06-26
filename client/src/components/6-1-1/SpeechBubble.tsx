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

export const SpeechBubble = ({
  position,
  html,
  // onPointClick,
  onBubbleClick,
  pointColor = '#ff6b6b',
  pointSize = 0.03,
  bubbleOffset = [0.2, 0.8, 0],
}: SpeechBubbleProps) => {
  const [isHovered, setIsHovered] = React.useState(false)

  useCursor(isHovered)
  return (
    <group position={position}>
      {/* 점(Point) */}
      <mesh
        scale={isHovered ? 1.2 : 1}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onClick={onBubbleClick}>
        <sphereGeometry args={[pointSize, 16, 16]} />
        <meshBasicMaterial color={pointColor} />
      </mesh>

      {/* 말풍선 */}
      <Html prepend={true} transform={false} position={[bubbleOffset[0], bubbleOffset[1], bubbleOffset[2]]}>
        <div
          style={{
            userSelect: 'none', // 텍스트 선택 방지
            WebkitUserSelect: 'none', // Safari 지원
            MozUserSelect: 'none', // Firefox 지원
            msUserSelect: 'none', // IE 지원
            borderColor: pointColor,
          }}
          className='bg-white p-3 rounded-xl shadow-xl border-2 relative cursor-pointer hover:scale-105 active:scale-95 transition-all'
          onClick={() => {
            onBubbleClick?.()
            console.log('말풍선 클릭됨', position)
          }}>
          <div className='text-sm text-gray-800 whitespace-nowrap' dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </Html>
    </group>
  )
}
