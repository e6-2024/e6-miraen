import { motion, AnimatePresence } from 'framer-motion'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { ViewMode, VehicleId, AnimationState } from '@/types/6-1-2/types'
import { findVehicleById } from '@/utils/6-1-2/utils'
import { useEffect, useState, useRef } from 'react'

interface VehicleInfoProps {
  viewMode: ViewMode
  selectedVehicle: VehicleId
  animationState: AnimationState
}

const MAX_TIME = 10.0

export function VehicleInfo({ viewMode, selectedVehicle, animationState }: VehicleInfoProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [distance, setDistance] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const accumulatedTimeRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)

  const vehicle = findVehicleById(selectedVehicle)
  const speed = vehicle?.speed || 0

  useEffect(() => {
    const updateTime = () => {
      if (startTimeRef.current !== null) {
        const currentTime = performance.now()
        const deltaTime = (currentTime - startTimeRef.current) / 1000
        const totalTime = Math.min(accumulatedTimeRef.current + deltaTime, MAX_TIME)
        setElapsedTime(totalTime)
        
        if (totalTime < MAX_TIME) {
          animationFrameRef.current = requestAnimationFrame(updateTime)
        }
      }
    }

    if (animationState.isPlaying && !animationState.isPaused) {
      startTimeRef.current = performance.now()
      animationFrameRef.current = requestAnimationFrame(updateTime)
    } else if (animationState.isPaused) {
      if (startTimeRef.current !== null) {
        const currentTime = performance.now()
        const deltaTime = (currentTime - startTimeRef.current) / 1000
        accumulatedTimeRef.current = Math.min(accumulatedTimeRef.current + deltaTime, MAX_TIME)
        startTimeRef.current = null
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }

    if (animationState.resetTrigger) {
      setElapsedTime(0)
      setDistance(0)
      accumulatedTimeRef.current = 0
      startTimeRef.current = null
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }

    if (animationState.isCompleted) {
      setElapsedTime(MAX_TIME)
      accumulatedTimeRef.current = MAX_TIME
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animationState.isPlaying, animationState.isPaused, animationState.resetTrigger, animationState.isCompleted])

  useEffect(() => {
    setDistance(speed * elapsedTime)
  }, [speed, elapsedTime])

  if (viewMode !== 'firstPerson') {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className='fixed bottom-8 right-8 z-10'>
        <CrayonTextBox color='#8B5CF6' bg='#FFFFFF' padding={20} paddingY={12} width={250}>
          <h4 className='text-2xl font-bold text-black mb-3 text-center'>{vehicle?.name} 정보</h4>
          <div className='space-y-2 text-xl font-light'>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>이동 시간:</span>
              <span className='font-semibold text-gray-800'>{elapsedTime.toFixed(1)} 초</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>이동 거리:</span>
              <span className='font-semibold text-gray-800'>{distance.toFixed(1)} m</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-gray-600'>속력:</span>
              <span className='font-semibold text-gray-800'>
                {elapsedTime === 0 || animationState.isPaused ? 0 : speed} m/s
              </span>
            </div>
          </div>
        </CrayonTextBox>
      </motion.div>
    </AnimatePresence>
  )
}