import React from 'react';
import { TimeOfDay } from '@/types/5-2-3/types';

interface TimeSelectorProps {
  timeOfDay: TimeOfDay;
  onTimeSelect: (time: TimeOfDay) => void;
  visible: boolean;
}

const Sun = () => <div className='font-bold text-black'>낮</div>;
const Moon = () => <div className='font-bold text-black'>밤</div>;

export const TimeSelector: React.FC<TimeSelectorProps> = ({ timeOfDay, onTimeSelect, visible }) => {
  if (!visible) return null;

  return (
    <div className='absolute top-4 left-1/2 transform -translate-x-1/2 text-lg flex gap-2 z-30'>
      <button
        onClick={() => onTimeSelect('day')}
        className={`p-3 rounded-full transition-all duration-300 ${
          timeOfDay === 'day'
            ? 'bg-yellow-400 text-white opacity-100 scale-110'
            : 'bg-white text-yellow-400 opacity-40 hover:opacity-70'
        } hover:scale-110 shadow-lg`}>
        <Sun />
      </button>
      <button
        onClick={() => onTimeSelect('night')}
        className={`p-3 rounded-full transition-all duration-300 ${
          timeOfDay === 'night'
            ? 'bg-purple-600 text-white opacity-100 scale-110'
            : 'bg-white text-purple-600 opacity-40 hover:opacity-70'
        } hover:scale-110 shadow-lg`}>
        <Moon />
      </button>
    </div>
  );
};
