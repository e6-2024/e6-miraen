import { useRef, useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Group, Vector2 } from 'three';

interface Props {
  groupRef: React.RefObject<Group>;
  setGravity: React.Dispatch<React.SetStateAction<[number, number, number]>>;
}

export default function TiltController({ groupRef, setGravity }: Props) {
  const { gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const startPosition = useRef(new Vector2());
  const currentPosition = useRef(new Vector2());
  const tiltLimit = 0.25; // 최대 기울기 제한 (라디안)
  
  // 시작 회전값 저장
  const startRotation = useRef({ x: 0, z: 0 });
  
  useEffect(() => {
    const canvas = gl.domElement;
    
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      
      // 정규화된 좌표로 변환 (-1 ~ 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      startPosition.current.set(x, y);
      currentPosition.current.set(x, y);
      
      // 현재 회전값 저장
      if (groupRef.current) {
        startRotation.current.x = groupRef.current.rotation.x;
        startRotation.current.z = groupRef.current.rotation.z;
      }
      
      setIsDragging(true);
    };
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !groupRef.current) return;
      
      // 정규화된 좌표로 변환
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      currentPosition.current.set(x, y);
      
      // 드래그 거리 계산
      const deltaX = currentPosition.current.x - startPosition.current.x;
      const deltaY = currentPosition.current.y - startPosition.current.y;
      
      // 초기 회전값 + 드래그에 따른 추가 회전
      const sensitivity = 1.5; // 감도 조절
      const newRotationZ = startRotation.current.z + deltaX * sensitivity;
      const newRotationX = startRotation.current.x - deltaY * sensitivity;
      
      // 회전 제한 적용
      const clampedZ = Math.max(-tiltLimit, Math.min(tiltLimit, newRotationZ));
      const clampedX = Math.max(-tiltLimit, Math.min(tiltLimit, newRotationX));
      
      // 체 회전 적용
      groupRef.current.rotation.z = clampedZ;
      groupRef.current.rotation.x = clampedX;
      
      // 중력 벡터 계산
      updateGravityFromRotation(clampedX, clampedZ);
    };
    
    const onMouseUp = () => {
      setIsDragging(false);
    };
    
    // 터치 이벤트 (모바일 지원)
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
      
      const clampedZ = Math.max(-tiltLimit, Math.min(tiltLimit, newRotationZ));
      const clampedX = Math.max(-tiltLimit, Math.min(tiltLimit, newRotationX));
      
      groupRef.current.rotation.z = clampedZ;
      groupRef.current.rotation.x = clampedX;
      
      updateGravityFromRotation(clampedX, clampedZ);
    };
    
    const onTouchEnd = () => {
      setIsDragging(false);
    };
    
    // 수정된 중력 계산 함수
    const updateGravityFromRotation = (angleX: number, angleZ: number) => {
      const gravityMagnitude = 9.81;
      
      // 부호 수정: 체가 오른쪽으로 기울면(+Z 회전) 공은 왼쪽으로 굴러가야 함(-X 중력)
      const gravityX = -Math.sin(angleZ) * gravityMagnitude;
      
      // 부호 수정: 체가 앞으로 기울면(-X 회전) 공은 앞으로 굴러가야 함(+Z 중력)
      const gravityZ = Math.sin(angleX) * gravityMagnitude;
      
      // Y 방향 중력
      const totalAngle = Math.sqrt(angleX * angleX + angleZ * angleZ);
      const gravityY = -gravityMagnitude * Math.cos(totalAngle);
      
      // 디버깅 로그
      console.log(`Rotation - X: ${angleX.toFixed(2)}, Z: ${angleZ.toFixed(2)}`);
      console.log(`Gravity - X: ${gravityX.toFixed(2)}, Y: ${gravityY.toFixed(2)}, Z: ${gravityZ.toFixed(2)}`);
      
      setGravity([gravityX, gravityY, gravityZ]);
    };
    
    // 이벤트 리스너 등록
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    
    // 클린업 함수
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [gl, groupRef, isDragging, setGravity]);
  
  // 커서 스타일 변경
  useEffect(() => {
    document.body.style.cursor = isDragging ? 'grabbing' : 'grab';
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [isDragging]);
  
  // 초기화 시 중력도 원래대로
  useEffect(() => {
    if (groupRef.current && 
        groupRef.current.rotation.x === 0 && 
        groupRef.current.rotation.z === 0) {
      setGravity([0, -9.81, 0]);
    }
  }, [groupRef, setGravity]);
  
  return null;
}