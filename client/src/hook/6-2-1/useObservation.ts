import { useState, useCallback, useRef, useEffect } from 'react';
import { TimeData, SunPosition, ObservationState } from '@/types/6-2-1/types';
import { calculateSunPosition, formatTimeData, getTimeIntervalData } from '@/utils/6-2-1/utils';

export const useObservation = (rawTimeData: TimeData[]) => {
  const [state, setState] = useState<ObservationState>({
    currentTimeIndex: 0,
    isPlaying: false,
    progress: 0,
    showObservationLines: false,
    showThermometer: true,
    selectedTimeData: null,
    isTimeIntervalMode: false,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 포맷된 시간 데이터
  const timeData = formatTimeData(rawTimeData);
  const intervalData = getTimeIntervalData(timeData);

  // 현재 표시할 데이터 결정
  const getCurrentData = useCallback((): TimeData => {
    if (state.selectedTimeData) return state.selectedTimeData;
    return timeData[state.currentTimeIndex] || timeData[0];
  }, [state.currentTimeIndex, state.selectedTimeData, timeData]);

  const currentData = getCurrentData();

  // 태양 위치 계산
  const sunPosition: SunPosition = calculateSunPosition(
    currentData.azimuth,
    currentData.altitude
  );

  // 재생/일시정지 토글
  const togglePlayback = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // 진행률 클릭 처리
  const handleProgressClick = useCallback((clickX: number, barWidth: number) => {
    if (state.isTimeIntervalMode) return;
    
    const clickRatio = clickX / barWidth;
    const newIndex = Math.round(clickRatio * (timeData.length - 1));
    const clampedIndex = Math.max(0, Math.min(newIndex, timeData.length - 1));
    
    setState(prev => ({
      ...prev,
      currentTimeIndex: clampedIndex,
      progress: (clampedIndex / (timeData.length - 1)) * 100,
    }));
  }, [state.isTimeIntervalMode, timeData.length]);

  // 특정 시간 데이터 선택
  const selectTimeData = useCallback((data: TimeData | null) => {
    setState(prev => ({
      ...prev,
      selectedTimeData: data,
      isPlaying: false,
      isTimeIntervalMode: !!data,
    }));
  }, []);

  // 관측선 표시 토글
  const setShowObservationLines = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showObservationLines: show }));
  }, []);

  // 온도계 표시 토글
  const setShowThermometer = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showThermometer: show }));
  }, []);

  // 시간 인덱스 설정
  const setCurrentTimeIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentTimeIndex: index }));
  }, []);

  // 자동 재생 효과
  useEffect(() => {
    if (state.isPlaying && !state.isTimeIntervalMode) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const nextIndex = (prev.currentTimeIndex + 1) % timeData.length;
          return {
            ...prev,
            currentTimeIndex: nextIndex,
            progress: (nextIndex / (timeData.length - 1)) * 100,
          };
        });
      }, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isPlaying, state.isTimeIntervalMode, timeData.length]);

  // 진행률 업데이트
  useEffect(() => {
    if (!state.isTimeIntervalMode && !state.selectedTimeData) {
      setState(prev => ({
        ...prev,
        progress: (prev.currentTimeIndex / (timeData.length - 1)) * 100,
      }));
    }
  }, [state.currentTimeIndex, state.isTimeIntervalMode, state.selectedTimeData, timeData.length]);

  // 정리
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    // State
    ...state,
    currentData,
    sunPosition,
    
    // Data
    timeData,
    intervalData,
    
    // Actions
    togglePlayback,
    handleProgressClick,
    selectTimeData,
    setShowObservationLines,
    setShowThermometer,
    setCurrentTimeIndex,
    cleanup,
  };
};