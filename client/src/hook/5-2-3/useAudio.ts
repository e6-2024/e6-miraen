import { useCallback, useRef } from 'react';

export const useAudio = () => {
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const playSound = useCallback((audioPath: string, volume: number = 0.7) => {
    try {
      if (audioRefs.current[audioPath]) {
        audioRefs.current[audioPath].pause();
        audioRefs.current[audioPath].currentTime = 0;
      }

      const audio = new Audio(audioPath);
      audio.volume = volume;
      audioRefs.current[audioPath] = audio;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('효과음 재생 실패:', error.name);
        });
      }
    } catch (error) {
      console.log('효과음 생성 실패:', error);
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    audioRefs.current = {};
  }, []);

  return { playSound, stopAllAudio };
};