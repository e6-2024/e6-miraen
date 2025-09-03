import { useRef, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Group, Vector2 } from 'three';
import { PHYSICS_CONFIG } from '@/utils/5-2-1/sieveConfig';

interface Props {
  groupRef: React.RefObject<Group>;
  setGravity: React.Dispatch<React.SetStateAction<[number, number, number]>>;
}

export default function TiltController({ groupRef, setGravity }: Props) {
  const { gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const startPosition = useRef(new Vector2());
  const currentPosition = useRef(new Vector2());
  const startRotation = useRef({ x: 0, z: 0 });
  
  useEffect(() => {
    const canvas = gl.domElement;
    
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      startPosition.current.set(x, y);
      currentPosition.current.set(x, y);
      
      if (groupRef.current) {
        startRotation.current.x = groupRef.current.rotation.x;
        startRotation.current.z = groupRef.current.rotation.z;
      }
      
      setIsDragging(true);
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !groupRef.current) return;
      
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      currentPosition.current.set(x, y);
      
      const deltaX = currentPosition.current.x - startPosition.current.x;
      const deltaY = currentPosition.current.y - startPosition.current.y;
      
      const newRotationZ = startRotation.current.z + deltaX * PHYSICS_CONFIG.sensitivity;
      const newRotationX = startRotation.current.x - deltaY * PHYSICS_CONFIG.sensitivity;
      
      const clampedZ = Math.max(-PHYSICS_CONFIG.tiltLimit, Math.min(PHYSICS_CONFIG.tiltLimit, newRotationZ));
      const clampedX = Math.max(-PHYSICS_CONFIG.tiltLimit, Math.min(PHYSICS_CONFIG.tiltLimit, newRotationX));
      
      groupRef.current.rotation.z = clampedZ;
      groupRef.current.rotation.x = clampedX;
      
      updateGravityFromRotation(clampedX, clampedZ);
    };
    
    const onMouseUp = () => {
      setIsDragging(false);
    };
    
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const x = (touch.clientX / window.innerWidth) * 2 - 1;
        const y = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        startPosition.current.set(x, y);
        currentPosition.current.set(x, y);
        
        if (groupRef.current) {
          startRotation.current.x = groupRef.current.rotation.x;
          startRotation.current.z = groupRef.current.rotation.z;
        }
        
        setIsDragging(true);
      }
    };
    
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || !groupRef.current || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const x = (touch.clientX / window.innerWidth) * 2 - 1;
      const y = -(touch.clientY / window.innerHeight) * 2 + 1;
      
      currentPosition.current.set(x, y);
      
      const deltaX = currentPosition.current.x - startPosition.current.x;
      const deltaY = currentPosition.current.y - startPosition.current.y;
      
      const sensitivity = 1.5;
      const newRotationZ = startRotation.current.z + deltaX * sensitivity;
      const newRotationX = startRotation.current.x - deltaY * sensitivity;
      
      const clampedZ = Math.max(-PHYSICS_CONFIG.tiltLimit, Math.min(PHYSICS_CONFIG.tiltLimit, newRotationZ));
      const clampedX = Math.max(-PHYSICS_CONFIG.tiltLimit, Math.min(PHYSICS_CONFIG.tiltLimit, newRotationX));
      
      groupRef.current.rotation.z = clampedZ;
      groupRef.current.rotation.x = clampedX;
      
      updateGravityFromRotation(clampedX, clampedZ);
    };
    
    const onTouchEnd = () => {
      setIsDragging(false);
    };
    
    const updateGravityFromRotation = (angleX: number, angleZ: number) => {
      const gravityMagnitude = 20;
      
      const gravityX = -Math.sin(angleZ) * gravityMagnitude;
      const gravityZ = Math.sin(angleX) * gravityMagnitude;
      
      const totalAngle = Math.sqrt(angleX * angleX + angleZ * angleZ);
      const gravityY = -gravityMagnitude * Math.cos(totalAngle);
      
      setGravity([gravityX, gravityY, gravityZ]);
    };
    
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [gl, groupRef, isDragging, setGravity]);
  
  useEffect(() => {
    document.body.style.cursor = isDragging ? 'grabbing' : 'grab';
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [isDragging]);
  
  useEffect(() => {
    if (groupRef.current && 
        groupRef.current.rotation.x === 0 && 
        groupRef.current.rotation.z === 0) {
      setGravity([0, -20.81, 0]);
    }
  }, [groupRef, setGravity]);
  
  return null;
}