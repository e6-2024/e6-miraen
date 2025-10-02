import React from 'react'
import Scene from '../canvas/Scene'
import { OrbitControls, Environment } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { LensForPopup } from '@/components/5-1-2/LensForPopup'
import { LensType } from '@/types/5-1-2/types'
import { CrayonTextBox } from '@/components/common/CrayonTextBox'
import { X } from 'lucide-react'

interface LensPopupProps {
  isVisible: boolean
  lensType: LensType
  onClose: () => void
}

export function LensPopup({ isVisible, lensType, onClose }: LensPopupProps) {
  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center'>
        <CrayonTextBox width={600} height={500} position='relative'>
          <button onClick={onClose} className='absolute top-4 right-4 p-2 rounded-full transition-colors z-20'>
            <X size={24} color='#F3921C' />
          </button>

          <div className='absolute top-6 left-6 z-10'>
            <h2 className='text-xl font-bold text-gray-800'>
              {lensType === 'convex' ? '볼록 렌즈' : '오목 렌즈'}
            </h2>
          </div>

          <Scene
            className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
            camera={{ position: [0, 0, 8], fov: 50 }}>
            <color attach='background' args={['#f0f8ff']} />
            <Environment preset='city'/>
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <LensForPopup
              position={new THREE.Vector3(0, 0, 0)}
              type={lensType}
              scale={2.5}
              positionOffset={[0, -13, 0]}
            />

            <OrbitControls
              enableZoom
              enablePan
              enableRotate
              minAzimuthAngle={0}
              maxAzimuthAngle={Math.PI}
              minDistance={3}
              maxDistance={15}
              rotateSpeed={1}
            />
          </Scene>
        </CrayonTextBox>
      </motion.div>
    </AnimatePresence>
  )
}
