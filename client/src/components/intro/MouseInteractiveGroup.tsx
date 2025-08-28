import React from 'react'
import { useMouseInteraction } from '@/hook/useMouseInteraction'

interface MouseInteractiveGroupProps {
  /** 마우스 추적을 활성화할지 여부 */
  enabled?: boolean
  /** 마우스 움직임에 대한 감도 */
  sensitivity?: { x: number; y: number }
  /** 마우스가 화면 가장자리에 있을 때 중앙으로 돌아가는 시간 (ms) */
  edgeReturnDelay?: number
  /** 마우스가 화면을 벗어났을 때 중앙으로 돌아가는 시간 (ms) */
  leaveReturnDelay?: number
  /** 부드러운 움직임을 위한 보간 속도 */
  lerpSpeed?: number
  /** 가장자리 감지를 위한 마진 */
  edgeMargin?: number
  /** 자식 컴포넌트들 */
  children: React.ReactNode
  /** 추가 회전 오프셋 */
  rotationOffset?: [number, number, number]
}

export const MouseInteractiveGroup: React.FC<MouseInteractiveGroupProps> = ({
  enabled = true,
  sensitivity = { x: 0.3, y: 0.1 },
  edgeReturnDelay = 400,
  leaveReturnDelay = 300,
  lerpSpeed = 0.05,
  edgeMargin = 0.05,
  children,
  rotationOffset = [0, 0, 0],
}) => {
  const { rotation } = useMouseInteraction({
    enabled,
    sensitivity,
    edgeReturnDelay,
    leaveReturnDelay,
    lerpSpeed,
    edgeMargin,
  })

  const finalRotation: [number, number, number] = [
    rotation.rotationX + rotationOffset[0],
    rotation.rotationY + rotationOffset[1],
    rotationOffset[2],
  ]

  return <group rotation={finalRotation}>{children}</group>
}

export default MouseInteractiveGroup