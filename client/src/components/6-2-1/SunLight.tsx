import React, { useRef } from 'react'
import * as THREE from 'three'

interface SunLightProps {
  sunPosition: {
    sunX: number
    sunY: number
    sunZ: number
    azimuthRad: number
    altitudeRad: number
  }
}

function SunLight({ sunPosition }: SunLightProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null)

  return (
    <directionalLight
      ref={lightRef}
      position={[sunPosition.sunX, sunPosition.sunY, sunPosition.sunZ]}
      intensity={2}
      color='#FFFFFF'
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-far={50}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
      shadow-camera-near={0.1}
      shadow-bias={-0.0005}
    />
  )
}

export default SunLight