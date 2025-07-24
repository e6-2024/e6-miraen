import React from 'react'
import { Billboard, Text } from '@react-three/drei'

function CompassBillboard() {
  const compassData = [
    { position: [0, 0.2, 2] as [number, number, number], text: '북', color: '#ff4444', },
    { position: [2, 0.2, 0] as [number, number, number], text: '동', color: '#44ff44' },
    { position: [0, 0.2, -2] as [number, number, number], text: '남', color: '#4444ff' },
    { position: [-2, 0.2, 0] as [number, number, number], text: '서', color: '#ffff44' },
  ]

  return (
    <>
      {compassData.map((compass, index) => (
        <Billboard key={index} position={compass.position}>
          <Text font="/fonts/Maplestory Bold.ttf" fontSize={0.1} color={compass.color} anchorX='center' anchorY='middle'>
            {compass.text}
          </Text>
        </Billboard>
      ))}
    </>
  )
}

export default CompassBillboard