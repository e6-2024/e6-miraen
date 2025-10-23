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
      currentStep: 'day-selected', // 시간 선택 완료
      temperatures: getInitialTemperatures(),
      pressures: getPressures(timeOfDay),
    }))
    setPressureExtraAnimation(false)
  }, [])

  const startTemperatureAnimation = useCallback(() => {
    if (state.completedSteps.has('temperature')) return

    // 온도 관찰 시작 시 카메라를 observation 뷰로
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
          currentStep: 'day-selected', // 다시 버튼 선택 가능하도록
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

    setState((prev) => ({
      ...prev,
      currentStep: 'pressure-animation',
      showPressureDisplay: true,
    }))

    // 카메라 이동 시간(2초) 후 추가 애니메이션 트리거
    setTimeout(() => {
      setPressureExtraAnimation(true)
      
      setState((prev) => ({
        ...prev,
        currentStep: 'day-selected', // 다시 버튼 선택 가능하도록
        completedSteps: new Set(prev.completedSteps).add('pressure'),
      }))
    }, 2000)
  }, [state.completedSteps])

  const startWindAnimation = useCallback(() => {
    if (state.completedSteps.has('wind')) return

    if (state.timeOfDay === 'day') {
      setCameraTarget({
        position: CAMERA_CONFIGS.windObservation.position,
        lookAt: CAMERA_CONFIGS.windObservation.target,
      })
    } else {
      setCameraTarget({
        position: CAMERA_CONFIGS.windObservation.position2,
        lookAt: CAMERA_CONFIGS.windObservation.target2,
      })
    }
    
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
      // day-selected 이후에는 완료되지 않은 모든 버튼 활성화
      const isEnabled = !isCompleted && (
        state.currentStep === 'day-selected' ||
        state.currentStep === 'temperature-animation' ||
        state.currentStep === 'pressure-animation' ||
        state.currentStep === 'wind-animation'
      )

      return {
        id: step,
        label: step === 'temperature' ? '온도' : step === 'pressure' ? '기압' : '바람의 방향',
        enabled: isEnabled,
        completed: isCompleted,
      }
    },
    [state.currentStep, state.completedSteps],
  )

  const allStepsCompleted = useCallback(() => {
    return state.completedSteps.has('temperature') && 
           state.completedSteps.has('pressure') && 
           state.completedSteps.has('wind')
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