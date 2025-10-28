export type TimeOfDay = 'day' | 'night';
export type ExperimentStep = 'initial' | 'day-selected' | 'temperature-animation' | 'ready-for-pressure' | 'pressure-animation' | 'ready-for-wind' | 'wind-animation';
export type WindDirection = 'sea-to-land' | 'land-to-sea';

export interface TemperatureData {
  sea: number;
  land: number;
}

export interface PressureData {
  sea: 'high' | 'low';
  land: 'high' | 'low';
}

export interface ExperimentState {
  timeOfDay: TimeOfDay;
  currentStep: ExperimentStep;
  temperatures: TemperatureData;
  pressures: PressureData;
  showTemperatureDisplay: boolean;
  showPressureDisplay: boolean;
  showWind: boolean;
  isTemperatureAnimating: boolean;
  modelAnimationEnabled: boolean;
  temperatureEnabled: boolean;
  pressureEnabled: boolean;
  windEnabled: boolean;
}

export interface PopupContent {
  title: string;
  content: string;
  narrationPath: string;
}

export interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
}

export interface StepConfig {
  id: string;
  label: string;
  enabled: boolean;
  completed: boolean;
}