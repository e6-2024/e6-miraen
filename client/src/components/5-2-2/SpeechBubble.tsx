import React from 'react'
import { Html, Billboard } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'

interface SpeechBubbleProps {
  position: [number, number, number]
  text: string
  visible?: boolean
}

export const SpeechBubble = ({
  position,
  text,
  visible = true,
}: SpeechBubbleProps) => {
  return (
    <group position={position}>
      <AnimatePresence>
        {visible && (
          <Html
            center
            distanceFactor={1.7}
            transform
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
              zIndex: -1,
            }}>
            <div className='font-light text-white'>{text}</div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  )
}
