import {useState} from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Lightformer, PerformanceMonitor, AccumulativeShadows, RandomizedLight} from '@react-three/drei'
import Fish from '@/components/5-2-2/models/Fish'
import Meat from '@/components/5-2-2/models/Meat'
import Stove from '@/components/5-2-2/models/Stove'
import Model from '@/components/5-1-4-1/Model'
import Scene from '@/components/canvas/Scene'
import Flame from '@/components/5-2-2/Flame'

export default function Home() {
  const [perfSucks, degrade] = useState(false)
  const [isThermalMode, setIsThermalMode] = useState(false)

  const createCircularFlames = () => {
    const flames = [];
    const flameCount = 20;
    const radius = 0.13;
    
    for (let i = 0; i < flameCount; i++) {
      const angle = (i / flameCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      flames.push(
        <Flame 
          key={i}
          position={[x+0.35, 0.2, z-0.1]} 
          scale={0.2}
          opacity={isThermalMode ? 0.3 : 1} // 열화상 모드에서 불꽃 투명도 조절
        />
      );
    }
    
    return flames;
  };

  const createCircularFlames2 = () => {
    const flames = [];
    const flameCount = 20;
    const radius = 0.13;
    
    for (let i = 0; i < flameCount; i++) {
      const angle = (i / flameCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      flames.push(
        <Flame 
          key={i}
          position={[x-0.35, 0.2, z-0.1]} 
          scale={0.2}
          opacity={isThermalMode ? 0.3 : 1} // 열화상 모드에서 불꽃 투명도 조절
        />
      );
    }
    
    return flames;
  };

  return (
     <div className="w-screen h-screen bg-white flex flex-col relative">
        {/* Thermal Mode Toggle Button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsThermalMode(!isThermalMode)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              isThermalMode 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                : 'bg-red-600 text-white shadow-lg shadow-red-500/25'
            } hover:scale-105 active:scale-95`}
          >
            {isThermalMode ? '실제로 보기' : '열화상 카메라로 보기'}
          </button>
        </div>

        <Scene camera={{ position: [1, 1, 1], fov: 50 }}>
        <ambientLight intensity={isThermalMode ? 0.1 : 2}/>
        <PerformanceMonitor onDecline={() => degrade(true)} />
        
        {!isThermalMode && (
          <Environment frames={perfSucks ? 1 : Infinity} preset="studio" resolution={256} background={false} blur={1}>
            <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
            <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
            <group rotation={[Math.PI / 2, 1, 0]}>
              <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
              <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[50, 2, 1]} />
            </group>
            <Lightformer intensity={5} form="ring" color="white" rotation-y={Math.PI / 2} position={[1, 1, 1]} scale={[4, 4, 1]} />
          </Environment>
        )}
        
        <ContactShadows position={[0, 0, 0]} opacity={isThermalMode ? 0.1 : 0.9} scale={30} blur={1.5} far={2} color='black' frames={2} />
        <AccumulativeShadows frames={20} alphaTest={0.15} opacity={isThermalMode ? 0.05 : 0.1} scale={20} position={[0, 0, 0]}>
          <RandomizedLight amount={4} radius={3} ambient={0.3} intensity={isThermalMode ? 0.1 : 0.5} position={[0, 2, 0]} bias={0.001} />
        </AccumulativeShadows>
                
        <directionalLight position={[2, 2, 2]} intensity={isThermalMode ? 0.1 : 1} />
        
        <Fish scale={2} position={[0, 0, 0]} thermalMode={isThermalMode} />
        <Meat scale={2} position={[0, 0, 0]} thermalMode={isThermalMode} />
        <Stove scale={2} position={[0, 0, 0]} thermalMode={isThermalMode} />
        <Model/>
        {createCircularFlames()}
        {createCircularFlames2()}
        <OrbitControls />
        </Scene>
        
        {isThermalMode && (
          <div className="absolute inset-0 bg-black opacity-30 pointer-events-none" />
        )}
     </div>
  )
}
