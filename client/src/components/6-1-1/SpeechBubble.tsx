import React from 'react'
import { Line, Html, Billboard } from '@react-three/drei'

export const SpeechBubble = ({ position, html, onBubbleClick, bubbleOffset = [0.2, 0.8, 0] }) => {
  return (
    <>
      <group position={position}>
        <Line
          points={[
            [0, 1.0, 0],
            [0, 4.3, 0],
          ]}
          color='white'
          lineWidth={2}
        />
        <Billboard position={[0, 4.5, 0]}>
          <Html
            center
            distanceFactor={10}
            transform
            occlude
            style={{
              pointerEvents: 'auto',
              userSelect: 'none',
            }}>
            <div
              onClick={onBubbleClick}
              style={{
                backgroundColor: 'white',
                padding: '8px 12px',
                borderRadius: '12px',
                border: '2px solid #ddd',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                maxWidth: '200px',
                fontSize: '10px',
                cursor: onBubbleClick ? 'pointer' : 'default',
                position: 'relative',
                transition: 'transform 0.2s ease',
                fontFamily: 'MapleStory',
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Html>
        </Billboard>
      </group>
    </>
  )
}
