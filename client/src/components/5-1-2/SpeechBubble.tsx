import React from 'react';
import { Html, Billboard } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeechBubbleProps {
  position: [number, number, number];
  html: string;
  onBubbleClick?: () => void;
  pointColor?: string;
  bubbleOffset?: [number, number, number];
  visible?: boolean;
  delay?: number;
}

export const SpeechBubble = ({
  position,
  html,
  onBubbleClick,
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
              distanceFactor={10} 
              transform 
              occlude 
              style={{ 
                pointerEvents: 'auto', 
                userSelect: 'none' 
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay }}
                whileHover={{ scale: onBubbleClick ? 1.02 : 1 }}
                onClick={onBubbleClick}
                style={{
                  backgroundColor: 'white',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `2px solid ${pointColor}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  maxWidth: '300px',
                  fontSize: '14px',
                  cursor: onBubbleClick ? 'pointer' : 'default',
                  position: 'relative',
                  transition: 'transform 0.2s ease',
                  color: '#374151',
                  fontWeight: '500'
                }}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </Html>
          </Billboard>
        )}
      </AnimatePresence>
    </group>
  );
};