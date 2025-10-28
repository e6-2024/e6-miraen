import React from 'react'
import { getStepButtonStyle } from '@/utils/5-2-3/utils'
import { StepConfig } from '@/types/5-2-3/types'
import { CrayonTextButton } from '../common/CrayonUIButton'

interface StepControlsProps {
  steps: StepConfig[]
  onStepClick: (stepId: string) => void
  visible: boolean
}

export const StepControls: React.FC<StepControlsProps> = ({ steps, onStepClick, visible }) => {
  if (!visible) return null

  const getCompletedColors = (stepId: string) => {
    const colorMap = {
      temperature: {
        bg: '#F3921C',
        text: '#FFFFFF',
      },
      pressure: {
        bg: '#4E9F3D', 
        text: '#FFFFFF',
      },
      wind: {
        bg: '#6C63FF',
        text: '#FFFFFF',
      },
    }
    return colorMap[stepId] || { bg: '#333', text: '#fff' }
  }

  return (
    <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2 z-30 font-bold'>
      {steps.map((step) => {
        const colors = getCompletedColors(step.id)
        return (
          <CrayonTextButton
            color={step.completed ? colors.text : '#999'}
            textcolor={step.completed ? colors.text : '#333'}
            bg={step.completed ? colors.bg : '#fff'}
            key={step.id}
            text={step.label}
            onClick={() => step.enabled && onStepClick(step.id)}
            className={getStepButtonStyle(step.enabled, step.completed)}
          />
        )
      })}
    </div>
  )
}
