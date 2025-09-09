import React from 'react'
import { Billboard, Text } from '@react-three/drei'

function CompassBillboard() {
  const compassData = [
    { position: [0, 0.4, 8] as [number, number, number], text: '북', color: '#fff', },
    { position: [8, 0.4, 0] as [number, number, number], text: '동', color: '#fff' },
    { position: [0, 0.4, -8] as [number, number, number], text: '남', color: '#fff' },
    { position: [-8, 0.4, 0] as [number, number, number], text: '서', color: '#fff' },
  ]

  return (
    <>
      {compassData.map((compass, index) => (
        <Billboard key={index} position={compass.position}>
          <Text font="/fonts/Maplestory Bold.ttf" fontSize={0.7} color={compass.color} anchorX='center' anchorY='middle'>
            {compass.text}
          </Text>
        </Billboard>
      ))}
    </>
  )
}

export default CompassBillboard