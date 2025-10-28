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
    temperatures: getInitialTemperatures(),
    pressures: { sea: 'high', land: 'low' },
    showTemperatureDisplay: false,
    showPressureDisplay: false,
    showWind: false,
    isTemperatureAnimating: false,
    modelAnimationEnabled: false,
    temperatureEnabled: false,
    pressureEnabled: false,
    windEnabled: false,
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
      temperatures: getInitialTemperatures(),
      pressures: getPressures(prev.timeOfDay),
      showTemperatureDisplay: false,
      showPressureDisplay: false,
      showWind: false,
      isTemperatureAnimating: false,
      modelAnimationEnabled: false,
      temperatureEnabled: false,
      pressureEnabled: false,
      windEnabled: false,
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
      showTemperatureDisplay: false,
      showPressureDisplay: false,
      showWind: false,
      temperatureEnabled: false,
      pressureEnabled: false,
      windEnabled: false,
    }))
    setPressureExtraAnimation(false)
  }, [])

  const toggleTemperature = useCallback(() => {
    const currentState = { ...state }
    const newEnabled = !currentState.temperatureEnabled
    const timeOfDay = currentState.timeOfDay

    if (!newEnabled) {
      if (animationCleanupRef.current) {
        animationCleanupRef.current()
        animationCleanupRef.current = null
      }

      setState({
        ...currentState,
        temperatureEnabled: false,
        showTemperatureDisplay: false,
        temperatures: getInitialTemperatures(),
        isTemperatureAnimating: false,
        currentStep: 'day-selected',
      })
      
      return
    }

    setState((prev) => ({
      ...prev,
      temperatureEnabled: true,
    }))

    setCameraTarget({
      position: CAMERA_CONFIGS.observation.position,
      lookAt: CAMERA_CONFIGS.observation.target,
    })

    setTimeout(() => {
      setState((current) => ({
        ...current,
        showTemperatureDisplay: true,
        isTemperatureAnimating: true,
        currentStep: 'temperature-animation',
        temperatures: getInitialTemperatures(),
      }))

      const cleanup = animateTemperature(
        timeOfDay,
        (sea, land) => {
          setState((s) => ({
            ...s,
            temperatures: { sea, land },
          }))
        },
        () => {
          setState((s) => ({
            ...s,
            isTemperatureAnimating: false,
            currentStep: 'day-selected',
          }))
        },
      )

      animationCleanupRef.current = cleanup
    }, 100)
  }, [state])

  const togglePressure = useCallback(() => {
    const currentState = { ...state }
    const newEnabled = !currentState.pressureEnabled

    if (!newEnabled) {
      setPressureExtraAnimation(false)
      setState({
        ...currentState,
        pressureEnabled: false,
        showPressureDisplay: false,
      })
      return
    }

    setState((prev) => ({
      ...prev,
      pressureEnabled: true,
      showPressureDisplay: true,
    }))

    setCameraTarget({
      position: CAMERA_CONFIGS.observation.position,
      lookAt: CAMERA_CONFIGS.observation.target,
    })
    
    setPressureExtraAnimation(true)
  }, [state])

  const toggleWind = useCallback(() => {
    const currentState = { ...state }
    const newEnabled = !currentState.windEnabled

    if (!newEnabled) {
      setState({
        ...currentState,
        windEnabled: false,
        showWind: false,
        modelAnimationEnabled: false,
        currentStep: 'day-selected',
      })
      return
    }

    const cameraConfig = currentState.timeOfDay === 'day' 
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
      windEnabled: true,
      showWind: true,
      modelAnimationEnabled: true,
      currentStep: 'wind-animation',
    }))
  }, [state])

  const getStepConfig = useCallback(
    (step: string) => {
      let enabled = false
      let completed = false

      if (step === 'temperature') {
        enabled = true
        completed = state.temperatureEnabled
      } else if (step === 'pressure') {
        enabled = true
        completed = state.pressureEnabled
      } else if (step === 'wind') {
        enabled = true
        completed = state.windEnabled
      }

      const labels = {
        temperature: '온도',
        pressure: '기압',
        wind: '바람의 방향',
      }

      return {
        id: step,
        label: labels[step as keyof typeof labels] || step,
        enabled,
        completed,
      }
    },
    [state.temperatureEnabled, state.pressureEnabled, state.windEnabled],
  )

  const allStepsCompleted = useCallback(() => {
    return state.temperatureEnabled && state.pressureEnabled && state.windEnabled
  }, [state.temperatureEnabled, state.pressureEnabled, state.windEnabled])

  return {
    state,
    cameraTarget,
    pressureExtraAnimation,
    setCameraTarget,
    resetExperiment,
    setTimeOfDay,
    toggleTemperature,
    togglePressure,
    toggleWind,
    getStepConfig,
    allStepsCompleted,
  }
}