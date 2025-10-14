import { useState, useEffect, useCallback, useMemo } from 'react';
import { TimeData, SunPosition } from '@/types/6-2-1/types';
import { calculateSunPosition } from '@/utils/6-2-1/utils';

export function useObservation(timeData: TimeData[]) {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showObservationLines, setShowObservationLines] = useState(false);
  const [selectedTimeData, setSelectedTimeData] = useState<TimeData | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.5);

  const currentData = useMemo(() => {
    if (selectedTimeData) return selectedTimeData;
    return timeData[currentTimeIndex];
  }, [currentTimeIndex, selectedTimeData, timeData]);

  const sunPosition = useMemo((): SunPosition => {
    return calculateSunPosition(currentData.azimuth, currentData.altitude);
  }, [currentData.azimuth, currentData.altitude]);

  const progress = useMemo(() => {
    if (selectedTimeData) {
      const index = timeData.findIndex(d => d.time === selectedTimeData.time);
      return ((index + 1) / timeData.length) * 100;
    }
    return ((currentTimeIndex + 1) / timeData.length) * 100;
  }, [currentTimeIndex, selectedTimeData, timeData]);

  useEffect(() => {
    if (!isPlaying || selectedTimeData) return;

    const baseInterval = 100;
    const interval = baseInterval / playbackSpeed;

    const timer = setInterval(() => {
      setCurrentTimeIndex((prev) => {
        if (prev >= timeData.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, selectedTimeData, timeData.length, playbackSpeed]);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const selectTimeData = useCallback((data: TimeData | null) => {
    setSelectedTimeData(data);
    if (data) {
      setIsPlaying(false);
      const index = timeData.findIndex(d => d.time === data.time);
      if (index !== -1) {
        setCurrentTimeIndex(index);
      }
    }
  }, [timeData]);

  const handleProgressClick = useCallback((clickX: number, barWidth: number) => {
    const clickPercent = clickX / barWidth;
    const newIndex = Math.floor(clickPercent * timeData.length);
    const clampedIndex = Math.max(0, Math.min(newIndex, timeData.length - 1));
    setCurrentTimeIndex(clampedIndex);
    setSelectedTimeData(null);
  }, [timeData.length]);

  const toggleSpeed = useCallback(() => {
    setPlaybackSpeed(prev => prev === 1.5 ? 2 : 1.5);
  }, []);

  return {
    currentData,
    sunPosition,
    progress,
    isPlaying,
    timeData,
    showObservationLines,
    playbackSpeed,
    setShowObservationLines,
    togglePlayback,
    selectTimeData,
    handleProgressClick,
    toggleSpeed,
  };
}