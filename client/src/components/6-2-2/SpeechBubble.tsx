import React from 'react'
import { Html, Billboard, Line } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'

interface SpeechBubbleProps {
  position: [number, number, number]
  html: string
  pointColor?: string
  bubbleOffset?: [number, number, number]
  visible?: boolean
  delay?: number
  showLine?: boolean
  lineStart?: [number, number, number]
  lineEnd?: [number, number, number]
  lineColor?: string
}

export const SpeechBubble = ({
  position,
  html,
  pointColor = '#ff6b6b',
  bubbleOffset = [0.2, 0.8, 0],
  visible = true,
  delay = 0,
  showLine = false,
  lineStart = [0, 0, 0],
  lineEnd = [0.2, 0.8, 0],
  lineColor = '#ffffff',
}: SpeechBubbleProps) => {
  return (
    <group position={position}>
      {visible && showLine && (
        <Line
          points={[lineStart, lineEnd]}
          color={lineColor}
          lineWidth={2}
        />
      )}

      <AnimatePresence>
        {visible && (
          <Billboard position={bubbleOffset}>
            <Html
              center
              distanceFactor={10}
              transform
              occlude
              style={{
                pointerEvents: 'auto',
                userSelect: 'none',
                zIndex: -1,
              }}>
              <div className='font-light'>{html}</div>
            </Html>
          </Billboard>
        )}
      </AnimatePresence>
    </group>
  )
}