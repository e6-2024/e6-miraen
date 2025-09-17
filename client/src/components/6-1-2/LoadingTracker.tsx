import { useEffect } from 'react';
import { useProgress } from '@react-three/drei';

interface LoadingTrackerProps {
  onLoadingComplete: () => void;
}

export function LoadingTracker({ onLoadingComplete }: LoadingTrackerProps) {
  const { progress, active } = useProgress();

  useEffect(() => {
    if (!active && progress === 100) {
      onLoadingComplete();
    }
  }, [active, progress, onLoadingComplete]);

  return null;
}