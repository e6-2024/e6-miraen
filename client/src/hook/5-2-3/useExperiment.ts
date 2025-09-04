import { useState, useCallback, useRef } from 'react';
import { ExperimentState, TimeOfDay, ExperimentStep, CameraTarget } from '@/types/5-2-3/types';
import { getInitialTemperatures, getFinalTemperatures, getPressures, animateTemperature, CAMERA_CONFIGS } from '@/utils/5-2-3/utils';

export const useExperiment = () => {
  const [state, setState] = useState<ExperimentState>({
    timeOfDay: 'day',
    currentStep: 'initial',
    completedSteps: new Set(),
    temperatures: getInitialTemperatures(),
    pressures: { sea: 'high', land: 'low' },
    showTemperatureDisplay: false,
    showPressureDisplay: false,
    showWind: false,
    isTemperatureAnimating: false,
    modelAnimationEnabled: false,
  });

  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null);
  const animationCleanupRef = useRef<(() => void) | null>(null);

  const resetExperiment = useCallback(() => {
    if (animationCleanupRef.current) {
      animationCleanupRef.current();
      animationCleanupRef.current = null;
    }

    setState({
      timeOfDay: state.timeOfDay,
      currentStep: 'initial',
      completedSteps: new Set(),
      temperatures: getInitialTemperatures(),
      pressures: getPressures(state.timeOfDay),
      showTemperatureDisplay: false,
      showPressureDisplay: false,
      showWind: false,
      isTemperatureAnimating: false,
      modelAnimationEnabled: false,
    });

    setCameraTarget({
      position: CAMERA_CONFIGS.initial.position,
      lookAt: CAMERA_CONFIGS.initial.target,
    });
  }, [state.timeOfDay]);

  const setTimeOfDay = useCallback((timeOfDay: TimeOfDay) => {
    setState(prev => ({
      ...prev,
      timeOfDay,
      currentStep: 'day-selected',
      temperatures: getInitialTemperatures(),
      pressures: getPressures(timeOfDay),
    }));
  }, []);

  const startTemperatureAnimation = useCallback(() => {
    if (state.completedSteps.has('temperature')) return;

    setState(prev => ({
      ...prev,
      currentStep: 'temperature-animation',
      showTemperatureDisplay: true,
      isTemperatureAnimating: true,
    }));

    const cleanup = animateTemperature(
      state.timeOfDay,
      (sea, land) => {
        setState(prev => ({
          ...prev,
          temperatures: { sea, land },
        }));
      },
      () => {
        setState(prev => ({
          ...prev,
          isTemperatureAnimating: false,
          currentStep: 'ready-for-pressure',
          completedSteps: new Set(prev.completedSteps).add('temperature'),
        }));
      }
    );

    animationCleanupRef.current = cleanup;
  }, [state.timeOfDay, state.completedSteps]);

  const startPressureAnimation = useCallback(() => {
    if (state.completedSteps.has('pressure')) return;

    setState(prev => ({
      ...prev,
      currentStep: 'pressure-animation',
      showPressureDisplay: true,
      completedSteps: new Set(prev.completedSteps).add('pressure'),
    }));

    setTimeout(() => {
      setState(prev => ({
        ...prev,
        currentStep: 'ready-for-wind',
      }));
    }, 1500);
  }, [state.completedSteps]);

  const startWindAnimation = useCallback(() => {
    if (state.completedSteps.has('wind')) return;

    setState(prev => ({
      ...prev,
      currentStep: 'wind-animation',
      showWind: true,
      modelAnimationEnabled: true,
      completedSteps: new Set(prev.completedSteps).add('wind'),
    }));

    setCameraTarget({
      position: [-5, -14, 3],
      lookAt: [-5, -14, 1],
    });
  }, [state.completedSteps]);

  const getStepConfig = useCallback((step: string) => {
    const isCompleted = state.completedSteps.has(step);
    let isEnabled = false;

    switch (step) {
      case 'temperature':
        isEnabled = !isCompleted && state.currentStep === 'day-selected';
        break;
      case 'pressure':
        isEnabled = !isCompleted && state.currentStep === 'ready-for-pressure';
        break;
      case 'wind':
        isEnabled = !isCompleted && state.currentStep === 'ready-for-wind';
        break;
    }

    return {
      id: step,
      label: step === 'temperature' ? '온도' : step === 'pressure' ? '기압' : '바람의 방향',
      enabled: isEnabled,
      completed: isCompleted,
    };
  }, [state.currentStep, state.completedSteps]);

  return {
    state,
    cameraTarget,
    setCameraTarget,
    resetExperiment,
    setTimeOfDay,
    startTemperatureAnimation,
    startPressureAnimation,
    startWindAnimation,
    getStepConfig,
  };
};