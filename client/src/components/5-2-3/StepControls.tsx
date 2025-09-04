// client/src/components/5-2-3/StepControls.tsx
import React from 'react';
import { getStepButtonStyle } from '@/utils/5-2-3/utils';
import { StepConfig } from '@/types/5-2-3/types';

interface StepControlsProps {
  steps: StepConfig[];
  onStepClick: (stepId: string) => void;
  visible: boolean;
}

export const StepControls: React.FC<StepControlsProps> = ({ steps, onStepClick, visible }) => {
  if (!visible) return null;

  return (
    <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-30 font-bold'>
      {steps.map((step) => (
        <button
          key={step.id}
          onClick={() => step.enabled && onStepClick(step.id)}
          className={getStepButtonStyle(step.enabled, step.completed)}>
          {step.label}
        </button>
      ))}
    </div>
  );
};
