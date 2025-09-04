import { useProgress } from '@react-three/drei';
import { useEffect } from 'react';

interface LoadingTrackerProps {
  onLoadingComplete: () => void;
}

export const LoadingTracker: React.FC<LoadingTrackerProps> = ({ onLoadingComplete }) => {
  const { progress, active } = useProgress();

  useEffect(() => {
    onLoadingComplete();
  }, [active, progress, onLoadingComplete]);

  return null;
};