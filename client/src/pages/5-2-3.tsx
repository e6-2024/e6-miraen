// client/src/pages/5-2-3.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { Environment, OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

import Scene from '@/components/canvas/Scene';
import Model from '@/components/5-2-3/Model';
import Intro from '@/components/intro/Intro';
import IntroMouseCameraController from '@/components/intro/IntroMouseCameraController';
import { CrayonTextButton } from '@/components/common/CrayonUIButton';

import { TimeSelector } from '@/components/5-2-3/TimeSelector';
import { Thermometer } from '@/components/5-2-3/Thermometer';
import { PressureDisplay } from '@/components/5-2-3/PressureDisplay';
import { StepControls } from '@/components/5-2-3/StepControls';
import { TimeAnimation } from '@/components/5-2-3/TimeAnimation';
import { CameraController } from '@/components/5-2-3/CameraController';
import { Popup } from '@/components/5-2-3/Popup';
import { LoadingTracker } from '@/components/5-2-3/LoadingTracker';

import { useExperiment } from '@/hook/5-2-3/useExperiment';
import { useAudio } from '@/hook/5-2-3/useAudio';
import { TimeOfDay, PopupContent } from '@/types/5-2-3/types';
import { getPopupContent, getWindDirection, getPressures } from '@/utils/5-2-3/utils';

const BUTTON_THEME = {
  goal: { bg: '#52AE46', border: '#A1CC90', text: '#FFFFFF' },
  guide: { bg: '#52AE46', border: '#A1CC90', text: '#FFFFFF' },
  start: { bg: '#F3921C', border: '#FFDBB0', text: '#FFFFFF' },
};

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState<PopupContent>({
    title: '',
    content: '',
    narrationPath: '',
  });

  const {
    state,
    cameraTarget,
    setCameraTarget,
    resetExperiment,
    setTimeOfDay,
    startTemperatureAnimation,
    startPressureAnimation,
    startWindAnimation,
    getStepConfig,
  } = useExperiment();

  const { playSound } = useAudio();

  // BGM 관련
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(true);
  const [bgmReady, setBgmReady] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem('bgmEnabled-5-2-3');
      if (saved !== null) setBgmEnabled(JSON.parse(saved));
    } catch {}
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const el = new Audio('/sounds/5-2-3/5-2-3-BGM.mp3');
    el.loop = true;
    el.volume = 0.2;
    bgmRef.current = el;
    return () => {
      el.pause();
      bgmRef.current = null;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !bgmRef.current) return;
    try {
      localStorage.setItem('bgmEnabled-5-2-3', JSON.stringify(bgmEnabled));
    } catch {}
    if (bgmEnabled && bgmReady) {
      bgmRef.current.play().catch(() => {});
    } else {
      bgmRef.current.pause();
    }
  }, [bgmEnabled, bgmReady, mounted]);

  const handleLoadingComplete = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleEnterExperience = useCallback(() => {
    playSound('/sounds/Enter_Cute.mp3');
    setBgmReady(true);
    setTimeout(() => {
      setShowIntro(false);
      setCameraTarget({
        position: [-5, -14, 1],
        lookAt: [-5, -14, 0],
      });
    }, 300);
  }, [playSound, setCameraTarget]);

  const handleBackToIntro = useCallback(() => {
    playSound('/sounds/Enter_Cute.mp3');
    setShowIntro(true);
    resetExperiment();
    setShowPopup(false);
    setBgmReady(false);
  }, [playSound, resetExperiment]);

  const handleTimeSelect = useCallback((time: TimeOfDay) => {
    playSound('/sounds/Enter_Cute.mp3');
    resetExperiment();
    setTimeOfDay(time);
    
    setTimeout(() => {
      setShowPopup(true);
      setPopupContent(getPopupContent(time, 'day-selected'));
    }, 100);
  }, [playSound, resetExperiment, setTimeOfDay]);

  const handleStepClick = useCallback((stepId: string) => {
    playSound('/sounds/5-1-1-0-0_click-tap-computer-mouse-352734.mp3');
    
    switch (stepId) {
      case 'temperature':
        startTemperatureAnimation();
        break;
      case 'pressure':
        startPressureAnimation();
        break;
      case 'wind':
        startWindAnimation();
        setTimeout(() => {
          setShowPopup(true);
          setPopupContent(getPopupContent(state.timeOfDay, 'wind-animation'));
        }, 2200);
        break;
    }
  }, [playSound, startTemperatureAnimation, startPressureAnimation, startWindAnimation, state.timeOfDay]);

  const toggleBgm = useCallback(() => {
    setBgmEnabled(v => !v);
  }, []);

  const stepConfigs = ['temperature', 'pressure', 'wind'].map(getStepConfig);
  const showExperimentUI = !showIntro && state.currentStep !== 'initial';
  const pressures = getPressures(state.timeOfDay);

  return (
    <div className='w-screen h-screen bg-red flex flex-col relative'>
      {/* 밤 오버레이 */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 z-5 ${
          state.timeOfDay === 'night' ? 'bg-black opacity-60' : 'opacity-0'
        } pointer-events-none`}
      />

      {/* 온도 표시 */}
      {state.showTemperatureDisplay && (
        <div className='absolute flex flex-row left-1/2 -translate-x-1/2 top-4 gap-[800px] z-30'>
          <Thermometer
            temperature={state.temperatures.sea}
            label='바다'
            color={state.timeOfDay === 'day' ? '#3b82f6' : '#ef4444'}
          />
          <Thermometer
            temperature={state.temperatures.land}
            label='육지'
            color={state.timeOfDay === 'day' ? '#ef4444' : '#3b82f6'}
          />
        </div>
      )}

      {/* 기압 표시 */}
      {state.showPressureDisplay && (
        <div className='absolute flex flex-row left-1/2 -translate-x-1/2 top-10 gap-[200px] z-30'>
          <PressureDisplay
            type={pressures.sea}
            label='바다'
            color={state.timeOfDay === 'day' ? '#ef4444' : '#3b82f6'}
          />
          <PressureDisplay
            type={pressures.land}
            label='육지'
            color={state.timeOfDay === 'day' ? '#3b82f6' : '#ef4444'}
          />
        </div>
      )}

      {/* 3D Scene */}
      <Scene
        camera={{ position: [0, 0.5, 3], fov: 50, far: 1000 }}
        shadows={{
          enabled: true,
          type: 'PCFSoftShadowMap',
        }}>
        <LoadingTracker onLoadingComplete={handleLoadingComplete} />
        <IntroMouseCameraController enabled={showIntro} />
        
        {/* 조명 설정 */}
        <ambientLight intensity={state.timeOfDay === 'day' ? 0.4 : 0.2} color={state.timeOfDay === 'day' ? '#ffffff' : '#404080'} />
        
        <directionalLight
          position={state.timeOfDay === 'day' ? [15, 20, 10] : [5, 15, 8]}
          intensity={state.timeOfDay === 'day' ? 1.5 : 0.6}
          color={state.timeOfDay === 'day' ? '#ffeaa7' : '#74b9ff'}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
          shadow-radius={10}
        />
        
        <directionalLight
          position={state.timeOfDay === 'day' ? [-5, 10, 5] : [-3, 8, 3]}
          intensity={state.timeOfDay === 'day' ? 0.3 : 0.15}
          color={state.timeOfDay === 'day' ? '#81ecec' : '#6c5ce7'}
        />
        
        <pointLight
          position={[-10, 2, 0]}
          intensity={state.timeOfDay === 'day' ? 0.8 : 0.3}
          color={state.timeOfDay === 'day' ? '#74b9ff' : '#00cec9'}
          distance={30}
          decay={2}
        />
      
        {/* 3D 모델 */}
        <Model
          scale={0.2}
          rotation={[0, -Math.PI / 2, 0]}
          position={[0, -15, 0]}
          windEnabled={state.showWind}
          windDirection={getWindDirection(state.timeOfDay)}
          windSpeed={0.2}
          isDay={state.timeOfDay === 'day'}
          animationEnabled={state.modelAnimationEnabled}
        />

        {/* 카메라 컨트롤 */}
        {cameraTarget ? (
          <CameraController
            targetPosition={cameraTarget.position}
            targetLookAt={cameraTarget.lookAt}
            enabled={!showIntro && !showPopup}
          />
        ) : (
          <OrbitControls enabled={!showIntro && !showPopup} minDistance={0} maxDistance={10} minPolarAngle={0} maxPolarAngle={Math.PI/2}/>
        )}

        <Environment preset={state.timeOfDay === 'day' ? 'sunset' : 'night'} blur={0.8} resolution={512} />
      </Scene>

      {/* UI 컨트롤들 */}
      <TimeSelector
        timeOfDay={state.timeOfDay}
        onTimeSelect={handleTimeSelect}
        visible={!showIntro}
      />

      <StepControls
        steps={stepConfigs}
        onStepClick={handleStepClick}
        visible={showExperimentUI}
      />

      <TimeAnimation
        isAnimating={state.isTemperatureAnimating}
        visible={state.currentStep === 'temperature-animation'}
      />

      {/* 홈 버튼 */}
      <CrayonTextButton
        ariaLabel='첫 화면으로'
        icon='home'
        position='absolute'
        iconPosition='left'
        onClick={handleBackToIntro}
        width={108}
        height={108}
        color='#ffffff'
        textcolor='#ffffff'
        bg='rgba(255,255,255,0.10)'
        className='backdrop-blur z-[200] right-[108px] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {/* BGM 토글 버튼 */}
      <CrayonTextButton
        icon={bgmEnabled ? 'volume2' : 'volumeX'}
        position='absolute'
        iconPosition='left'
        onClick={toggleBgm}
        width={108}
        height={108}
        color='#fff'
        textcolor='#fff'
        bg='rgba(255,255,255,0.10)'
        className='backdrop-blur z-[1000] right-[0px] mix-blend-difference'
        right={16}
        top={16}
        iconSize={40}
        innerCircleVisible={true}
      />

      {/* 인트로 */}
      {isLoaded && showIntro && (
        <Intro
          onEnter={handleEnterExperience}
          title='바닷가에서 부는 바람 방향 알아보기'
          description={['바닷가에서 바람은 어떻게 부는지 알아봅시다.']}
          backgroundSvg='/img/cover/5-2-3.svg'
          descriptionSound='/sounds/5-2-3/narration/5-2-3-Goal.MP3'
          buttonTheme={BUTTON_THEME}
        />
      )}

      {/* 팝업 */}
      <Popup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        content={popupContent}
      />
    </div>
  );
}