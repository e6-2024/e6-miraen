import React from 'react'
import { TimeOfDay } from '@/types/5-2-3/types'
import { CrayonToggle } from '@/components/common/CrayonToggle' // 경로 맞춰주세요

interface TimeSelectorProps {
  timeOfDay: TimeOfDay // 'day' | 'night'
  onTimeSelect: (time: TimeOfDay) => void
  visible: boolean
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ timeOfDay, onTimeSelect, visible }) => {
  if (!visible) return null

  const checked = timeOfDay === 'day'

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
      <CrayonToggle
        checked={checked}
        onChange={(next) => onTimeSelect(next ? 'day' : 'night')}
        leftLabel="낮"
        rightLabel="밤"
        width={200}
        height={78}
        ariaLabel="낮/밤 전환"
        bg="#fff7ed"
        border="#7c2d12"
        knobBg="#ffffff"
        activeText="#7c2d12"
        inactiveText="#64748b"
      />
    </div>
  )
}
