import React, { useState, useCallback } from 'react'
import * as THREE from 'three'
import { ControlPoint } from './ControlPoint'

interface WaterPathEditorProps {
  pathPoints: THREE.Vector3[]
  onPathChange: (newPoints: THREE.Vector3[]) => void
  visible: boolean
  orbitControlsRef: React.RefObject<any>
}

export function WaterPathEditor({ 
  pathPoints, 
  onPathChange, 
  visible,
  orbitControlsRef 
}: WaterPathEditorProps) {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handlePositionChange = useCallback((index: number, newPosition: THREE.Vector3) => {
    const newPoints = [...pathPoints]
    newPoints[index] = newPosition.clone()
    onPathChange(newPoints)
  }, [pathPoints, onPathChange])

  const handleDragStart = useCallback((index: number) => {
    setSelectedPointIndex(index)
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    // 선택은 유지하되 드래그 상태만 해제
  }, [])

  const handleSelect = useCallback((index: number, position: THREE.Vector3) => {
    setSelectedPointIndex(index)
  }, [])

  if (!visible) return null

  return (
    <group>
      {pathPoints.map((point, index) => (
        <ControlPoint
          key={index}
          position={point}
          index={index}
          totalPoints={pathPoints.length}
          onPositionChange={handlePositionChange}
          visible={visible}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onSelect={handleSelect}
          orbitControlsRef={orbitControlsRef}
        />
      ))}
    </group>
  )
}