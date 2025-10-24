import { useState, useCallback, useRef } from 'react'
import { ExperimentState, TimeOfDay, ExperimentStep, CameraTarget } from '@/types/5-2-3/types'
import {
  getInitialTemperatures,
  getFinalTemperatures,
  getPressures,
  animateTemperature,
  CAMERA_CONFIGS,
} from '@/utils/5-2-3/utils'

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
  })

  const [cameraTarget, setCameraTarget] = useState<CameraTarget | null>(null)
  const [pressureExtraAnimation, setPressureExtraAnimation] = useState(false)
  const animationCleanupRef = useRef<(() => void) | null>(null)

  const resetExperiment = useCallback(() => {
    if (animationCleanupRef.current) {
      animationCleanupRef.current()
      animationCleanupRef.current = null
    }

    setState((prev) => ({
      timeOfDay: prev.timeOfDay,
      currentStep: 'initial',
      completedSteps: new Set(),
      temperatures: getInitialTemperatures(),
      pressures: getPressures(prev.timeOfDay),
      showTemperatureDisplay: false,
      showPressureDisplay: false,
      showWind: false,
      isTemperatureAnimating: false,
      modelAnimationEnabled: false,
    }))

    setPressureExtraAnimation(false)
    setCameraTarget({
      position: CAMERA_CONFIGS.initial.position,
      lookAt: CAMERA_CONFIGS.initial.target,
    })
  }, [])

  const setTimeOfDay = useCallback((timeOfDay: TimeOfDay) => {
    setState((prev) => ({
      ...prev,
      timeOfDay,
      currentStep: 'day-selected',
      temperatures: getInitialTemperatures(),
      pressures: getPressures(timeOfDay),
    }))
    setPressureExtraAnimation(false)
  }, [])

  const startTemperatureAnimation = useCallback(() => {
    if (state.completedSteps.has('temperature')) return

    setCameraTarget({
      position: CAMERA_CONFIGS.observation.position,
      lookAt: CAMERA_CONFIGS.observation.target,
    })

    setState((prev) => ({
      ...prev,
      currentStep: 'temperature-animation',
      showTemperatureDisplay: true,
      isTemperatureAnimating: true,
    }))

    const cleanup = animateTemperature(
      state.timeOfDay,
      (sea, land) => {
        setState((prev) => ({
          ...prev,
          temperatures: { sea, land },
        }))
      },
      () => {
        setState((prev) => ({
          ...prev,
          isTemperatureAnimating: false,
          currentStep: 'day-selected',
          completedSteps: new Set(prev.completedSteps).add('temperature'),
        }))
      },
    )

    animationCleanupRef.current = cleanup
  }, [state.timeOfDay, state.completedSteps])

  const startPressureAnimation = useCallback(() => {
    if (state.completedSteps.has('pressure')) return
    
    setCameraTarget({
      position: CAMERA_CONFIGS.observation.position,
      lookAt: CAMERA_CONFIGS.observation.target,
    })

    setPressureExtraAnimation(true)
    
    setState((prev) => ({
      ...prev,
      currentStep: 'day-selected',
      showPressureDisplay: true,
      completedSteps: new Set(prev.completedSteps).add('pressure'),
    }))
  }, [state.completedSteps])

  const startWindAnimation = useCallback(() => {
    if (state.completedSteps.has('wind')) return

    const cameraConfig = state.timeOfDay === 'day' 
      ? CAMERA_CONFIGS.windObservation 
      : { 
          position: CAMERA_CONFIGS.windObservation.position2,
          target: CAMERA_CONFIGS.windObservation.target2 
        }

    setCameraTarget({
      position: cameraConfig.position,
      lookAt: cameraConfig.target,
    })
    
    setState((prev) => ({
      ...prev,
      currentStep: 'wind-animation',
      showWind: true,
      modelAnimationEnabled: true,
      completedSteps: new Set(prev.completedSteps).add('wind'),
    }))
  }, [state.completedSteps, state.timeOfDay])

  const getStepConfig = useCallback(
    (step: string) => {
      const isCompleted = state.completedSteps.has(step)
      const isInteractable = ['day-selected', 'temperature-animation', 'pressure-animation', 'wind-animation'].includes(state.currentStep)
      const isEnabled = !isCompleted && isInteractable

      const labels = {
        temperature: '온도',
        pressure: '기압',
        wind: '바람의 방향',
      }

      return {
        id: step,
        label: labels[step as keyof typeof labels] || step,
        enabled: isEnabled,
        completed: isCompleted,
      }
    },
    [state.currentStep, state.completedSteps],
  )

  const allStepsCompleted = useCallback(() => {
    return ['temperature', 'pressure', 'wind'].every(step => 
      state.completedSteps.has(step)
    )
  }, [state.completedSteps])

  return {
    state,
    cameraTarget,
    pressureExtraAnimation,
    setCameraTarget,
    resetExperiment,
    setTimeOfDay,
    startTemperatureAnimation,
    startPressureAnimation,
    startWindAnimation,
    getStepConfig,
    allStepsCompleted,
  }
}