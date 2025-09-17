import { motion, AnimatePresence } from 'framer-motion';
import { CrayonTextBox } from '@/components/common/CrayonTextBox';
import { ViewMode, VehicleId, AnimationState } from '@/types/6-1-2/types';
import { findVehicleById } from '@/utils/6-1-2/utils';
import { useEffect, useState } from 'react';

interface VehicleInfoProps {
  viewMode: ViewMode;
  selectedVehicle: VehicleId;
  animationState: AnimationState;
}

export function VehicleInfo({ viewMode, selectedVehicle, animationState }: VehicleInfoProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);

  const vehicle = findVehicleById(selectedVehicle);
  const speed = vehicle?.speed || 0;

  // 애니메이션 시간 추적
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (animationState.isPlaying && !animationState.isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100); // 0.1초마다 업데이트
    }

    if (animationState.resetTrigger) {
      setElapsedTime(0);
      setDistance(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [animationState.isPlaying, animationState.isPaused, animationState.resetTrigger]);

  // 거리 계산 (거리 = 속력 × 시간)
  useEffect(() => {
    setDistance(speed * elapsedTime);
  }, [speed, elapsedTime]);

  // firstPerson 모드일 때만 표시
  if (viewMode !== 'firstPerson') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='fixed bottom-8 right-8 z-10'
      >
        <CrayonTextBox 
          color='#8B5CF6' 
          bg='#FFF'
          animated={true}
        >
          <div className='min-w-[200px]'>
            <h4 className='text-base font-bold text-gray-700 mb-3 text-center'>
              {vehicle?.name} 정보
            </h4>
            <div className='space-y-2 text-base font-light'>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>이동 시간:</span>
                <span className='font-semibold text-gray-800'>
                  {elapsedTime.toFixed(1)}초
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>이동 거리:</span>
                <span className='font-semibold text-gray-800'>
                  {distance.toFixed(1)}m
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-gray-600'>속력:</span>
                <span className='font-semibold text-gray-800'>
                  {speed}m/s
                </span>
              </div>
            </div>
          </div>
        </CrayonTextBox>
      </motion.div>
    </AnimatePresence>
  );
}