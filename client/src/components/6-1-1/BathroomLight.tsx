import React from 'react'

interface BathroomLightProps {
  isOn: boolean
}

export const BathroomLight: React.FC<BathroomLightProps> = ({ isOn }) => {
  if (!isOn) return null

  return (
    <>
      <pointLight
        intensity={2}
        castShadow
        position={[11, 6, 1]}
        color="#ffffff"
        distance={15}
        decay={1}
      />
      
      <pointLight
        intensity={1.5}
        castShadow
        position={[9, 5, 1]}
        color="#f0f0f0"
        distance={12}
        decay={1}
      />
      
      <spotLight
        intensity={2}
        castShadow
        position={[11, 7, 2]}
        target-position={[11, 4, 0]}
        angle={0.4}
        penumbra={0.3}
        color="#ffffff"
        distance={20}
        decay={1}
      />
    </>
  )
}