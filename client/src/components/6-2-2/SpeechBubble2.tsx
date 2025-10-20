import React from 'react'
import { Line, Html, Billboard } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'

type SpeechBubbleProps = {
  position: [number, number, number]
  html: string
  onBubbleClick?: () => void
  bubbleOffset?: [number, number, number]
  visible?: boolean
  delay?: number
}

export const SpeechBubble2 = ({
  position,
  html,
  onBubbleClick,
  visible = true,
  delay = 0,
}: SpeechBubbleProps) => {
  return (
    <group position={position}>
      <AnimatePresence>
        {visible && (
          <Billboard position={[0, 4.5, 0]}>
            <Html center distanceFactor={10} transform occlude style={{ pointerEvents: 'auto', userSelect: 'none' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
                whileHover={{ scale: onBubbleClick ? 1.02 : 1 }}
                onClick={onBubbleClick}
                style={{
                  backgroundColor: 'white',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  border: '2px solid #ddd',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  maxWidth: '280px',
                  fontSize: '18px',
                  cursor: onBubbleClick ? 'pointer' : 'default',
                  position: 'relative',
                  transition: 'transform 0.2s ease',
                  fontFamily: 'MapleStory',
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </Html>
          </Billboard>
        )}
      </AnimatePresence>
    </group>
  )
}
