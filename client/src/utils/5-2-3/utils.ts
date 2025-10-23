import { TimeOfDay, ExperimentStep, TemperatureData, PressureData, CameraTarget } from '@/types/5-2-3/types';

export const INITIAL_CAMERA_POSITION: [number, number, number] =  [-5, -12, -5];
export const INITIAL_CAMERA_TARGET: [number, number, number] = [-5, -12, -6];

export const CAMERA_CONFIGS = {
  initial: {
    position: INITIAL_CAMERA_POSITION,
    target: INITIAL_CAMERA_TARGET,
  },
  observation: {
    position: [-5, -12, -5] as [number, number, number],
    target: [-5, -12, -6] as [number, number, number],
  },
  windObservation: {
    position: [-15, -8, 3.5] as [number, number, number],
    target: [-6, -10, -10] as [number, number, number],
    position2: [11, -8, 10] as [number, number, number],
    target2: [4, -10, -10] as [number, number, number],
  },
} as const;

export const getInitialTemperatures = (): TemperatureData => ({
  sea: 22,
  land: 22,
});

export const getFinalTemperatures = (timeOfDay: TimeOfDay): TemperatureData => {
  if (timeOfDay === 'day') {
    return { sea: 23, land: 40 };
  } else {
    return { sea: 18, land: 5 };
  }
};

export const getPressures = (timeOfDay: TimeOfDay): PressureData => {
  if (timeOfDay === 'day') {
    return { sea: 'high', land: 'low' };
  } else {
    return { sea: 'low', land: 'high' };
  }
};

export const getWindDirection = (timeOfDay: TimeOfDay): 'sea-to-land' | 'land-to-sea' => {
  return timeOfDay === 'day' ? 'sea-to-land' : 'land-to-sea';
};

export const getPopupContent = (timeOfDay: TimeOfDay, step: ExperimentStep) => {
  const contents = {
    'day-intro': {
      title: '낮 시간대',
      content: '낮에는 바다와 육지에서 바람은 어떻게 불까요?',
      narrationPath: '/sounds/5-2-3/narration/5-2-3-A.MP3',
    },
    'night-intro': {
      title: '밤 시간대',
      content: '밤에는 바다와 육지에서 바람은 어떻게 불까요?',
      narrationPath: '/sounds/5-2-3/narration/5-2-3-D.MP3',
    },
    'day-conclusion': {
      title: '낮에 바닷가에서 부는 바람',
      content: '낮에는 육지 온도가 바다 온도보다 상대적으로 높아져 바다는 고기압이 되고 육지는 저기압이 되어 바다에서 육지 쪽으로 바람이 붑니다.',
      narrationPath: '/sounds/5-2-3/narration/5-2-3-C.MP3',
    },
    'night-conclusion': {
      title: '밤에 바닷가에서 부는 바람',
      content: '밤에는 육지 온도가 바다 온도보다 상대적으로 낮아져 바다는 저기압이 되고 육지는 고기압이 되어 육지에서 바다 쪽으로 바람이 붑니다.',
      narrationPath: '/sounds/5-2-3/narration/5-2-3-F.MP3',
    },
  };

  const key = step === 'day-selected' 
    ? (timeOfDay === 'day' ? 'day-intro' : 'night-intro')
    : (timeOfDay === 'day' ? 'day-conclusion' : 'night-conclusion');

  return contents[key as keyof typeof contents];
};

export const getStepButtonStyle = (enabled: boolean, completed: boolean): string => {
  if (completed) {
    return 'cursor-default opacity-90';
  } else if (enabled) {
    return 'cursor-pointer';
  } else {
    return 'cursor-not-allowed opacity-50';
  }
};

export const animateTemperature = (
  timeOfDay: TimeOfDay,
  onUpdate: (sea: number, land: number) => void,
  onComplete: () => void
): () => void => {
  const initialTemps = getInitialTemperatures();
  const finalTemps = getFinalTemperatures(timeOfDay);
  
  let timeElapsed = 0;
  const duration = 3000;
  
  const interval = setInterval(() => {
    timeElapsed += 100;
    const progress = Math.min(timeElapsed / duration, 1);
    
    const newSeaTemp = initialTemps.sea + (finalTemps.sea - initialTemps.sea) * progress;
    const newLandTemp = initialTemps.land + (finalTemps.land - initialTemps.land) * progress;
    
    onUpdate(Math.round(newSeaTemp), Math.round(newLandTemp));
    
    if (progress >= 1) {
      clearInterval(interval);
      onComplete();
    }
  }, 100);
  
  return () => clearInterval(interval);
};