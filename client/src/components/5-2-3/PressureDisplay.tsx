import React from 'react'
import { motion } from 'framer-motion'
import { CrayonTextBox } from '../common/CrayonTextBox'

interface PressureDisplayProps {
  type: 'high' | 'low'
  label: string
  color: string
  position?: { top?: string; left?: string; right?: string; bottom?: string }
  delay?: number
  extraAnimation?: boolean
  side?: 'left' | 'right'
}

export const PressureDisplay: React.FC<PressureDisplayProps> = ({
  type,
  label,
  color,
  position = { top: '20px', left: '20px' },
  delay = 0,
  extraAnimation = false,
  side = 'left',
}) => {
  const isHigh = type === 'high'
  
  const extraX = extraAnimation ? (side === 'left' ? -150 : 150) : 0

  return (
    <motion.div
      className='z-20'
      style={position}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        x: extraX
      }}
      transition={{ 
        opacity: { type: 'spring', stiffness: 320, damping: 26, delay },
        y: { type: 'spring', stiffness: 320, damping: 26, delay },
        scale: { type: 'spring', stiffness: 320, damping: 26, delay },
        x: { 
          type: 'spring', 
          stiffness: 200, 
          damping: 20, 
          delay: extraAnimation ? 0 : delay 
        }
      }}
    >
      <CrayonTextBox
        color='#999'
        textcolor='#000000'
        bg='#fff'
        className='p-2'
        animated
      >
        <div className='text-center'>
          <div className='text-lg font-bold text-gray-700 mb-2'>{label}</div>
          <div className='text-xl font-bold text-gray-700'>
            {isHigh ? '고기압' : '저기압'}
          </div>
        </div>
      </CrayonTextBox>
    </motion.div>
  )
}