import React from 'react'
import { Html, Billboard } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'

interface SpeechBubbleProps {
  position: [number, number, number]
  html: string
  pointColor?: string
  bubbleOffset?: [number, number, number]
  visible?: boolean
  delay?: number
}

export const SpeechBubble = ({
  position,
  html,
  pointColor = '#ff6b6b',
  bubbleOffset = [0.2, 0.8, 0],
  visible = true,
  delay = 0,
}: SpeechBubbleProps) => {
  return (
    <group position={position}>
      <AnimatePresence>
        {visible && (
          <Billboard position={bubbleOffset}>
            <Html
              center
              distanceFactor={1.7}
              transform
              style={{
                pointerEvents: 'auto',
                userSelect: 'none',
                zIndex: -1,
              }}>
              <div className='font-light text-white'>{html}</div>
            </Html>
          </Billboard>
        )}
      </AnimatePresence>
    </group>
  )
}
