import React from 'react'
import { Text, Billboard } from '@react-three/drei'
import { AnimatePresence } from 'framer-motion'

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
  if (!visible) return null

  return (
    <group position={position}>
      <Billboard
      follow={false}
      >
        <Text
          color="white"
          fontSize={0.07}
          maxWidth={3}
          lineHeight={1.2}
          letterSpacing={0.02}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          font='/fonts/Maplestory Bold.ttf'
        >
          {text}
        </Text>
      </Billboard>
    </group>
  )
}