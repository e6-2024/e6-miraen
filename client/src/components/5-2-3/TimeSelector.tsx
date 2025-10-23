import React from 'react'
import { TimeOfDay } from '@/types/5-2-3/types'
import { CrayonToggle } from '@/components/common/CrayonToggle'

interface TimeSelectorProps {
  timeOfDay: TimeOfDay // 'day' | 'night'
  onTimeSelect: (time: TimeOfDay) => void
  visible: boolean
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ timeOfDay, onTimeSelect, visible }) => {
  if (!visible) return null

  const checked = timeOfDay === 'day'

  return (
    <div className='absolute top-4 left-1/2 -translate-x-1/2 z-30'>
      <CrayonToggle
        checked={checked}
        onChange={(next) => onTimeSelect(next ? 'day' : 'night')}
        width={180}
        height={80}
        aria-label='낮/밤 전환'
        dayBg='#fff'
        nightBg='#fff'
        borderColor={timeOfDay === 'day' ? '#F3921C' : '#333'}
        textColorDay='#F3921C'
        textColorNight='#333'
        knobBg='#FFFFFF'
        labelDay='낮'
        labelNight='밤'
      />
    </div>
  )
}
