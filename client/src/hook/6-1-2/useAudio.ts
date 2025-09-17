import { useCallback, useRef } from 'react';
import { VehicleId } from '@/types/6-1-2/types';
import { findVehicleById } from '@/utils/6-1-2/utils';

export const useAudio = () => {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);

  const playClickSound = useCallback((audioPath: string = '/sounds/Enter_Cute.mp3') => {
    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.7;
      audio.play().catch((error) => {
        console.log('효과음 재생 실패:', error.name);
      });
    } catch (error) {
      console.log('효과음 생성 실패:', error);
    }
  }, []);

  const playNarrationAudio = useCallback((
    audioPath: string,
    onSubtitleShow: (text: string) => void,
    onSubtitleHide: () => void,
    subtitleText: string,
    autoHideDelay?: number
  ) => {
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
    }

    try {
      const audio = new Audio(audioPath);
      audio.volume = 0.8;
      narrationAudioRef.current = audio;

      audio.play().catch((error) => {
        console.log('나레이션 오디오 재생 실패:', error.name);
      });

      onSubtitleShow(subtitleText);

      if (autoHideDelay) {
        setTimeout(() => {
          onSubtitleHide();
        }, autoHideDelay);
      }

      audio.onended = () => {
        if (narrationAudioRef.current === audio) {
          narrationAudioRef.current = null;
        }
        if (!autoHideDelay) {
          onSubtitleHide();
        }
      };
    } catch (error) {
      console.log('나레이션 오디오 생성 실패:', error);
    }
  }, []);

  const playVehicleAudio = useCallback((vehicleId: VehicleId) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    const vehicle = findVehicleById(vehicleId);
    if (vehicle && vehicle.audioPath) {
      try {
        const audio = new Audio(vehicle.audioPath);
        audio.volume = 0.8;
        currentAudioRef.current = audio;

        audio.play().catch((error) => {
          console.log(`${vehicle.name} 오디오 재생 실패:`, error.name);
        });

        audio.onended = () => {
          if (currentAudioRef.current === audio) {
            currentAudioRef.current = null;
          }
        };
      } catch (error) {
        console.log(`${vehicle?.name} 오디오 생성 실패:`, error);
      }
    }
  }, []);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  }, []);

  const stopNarrationAudio = useCallback(() => {
    if (narrationAudioRef.current) {
      narrationAudioRef.current.pause();
      narrationAudioRef.current.currentTime = 0;
      narrationAudioRef.current = null;
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    stopCurrentAudio();
    stopNarrationAudio();
  }, [stopCurrentAudio, stopNarrationAudio]);

  return {
    playClickSound,
    playNarrationAudio,
    playVehicleAudio,
    stopCurrentAudio,
    stopNarrationAudio,
    stopAllAudio,
  };
};