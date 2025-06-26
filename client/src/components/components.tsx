import { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import {
  StarsProps,
  DashedSphereProps,
  SunProps,
  EarthProps,
  RotationAxisProps,
  HumanModelProps,
  LargeSphereProps,
} from '../types/types'

// 텍스처 관련 유틸리티
const textureLoader = new THREE.TextureLoader()
const textureCache: { [key: string]: THREE.Texture } = {}

export function useTexture(path: string | null): THREE.Texture | null {
  const texture = useMemo(() => {
    if (!path) return null

    if (!textureCache[path]) {
      textureCache[path] = textureLoader.load(path)
    }

    return textureCache[path]
  }, [path])

  return texture
}

export function useGLTFWithCache(url: string) {
  return useGLTF(url)
}

// 기하학 관련 유틸리티
const circleGeometryCache: { [key: string]: THREE.BufferGeometry } = {}

export function getCircleGeometry(size: number, segments: number = 32): THREE.BufferGeometry {
  const key = `${size}_${segments}`

  if (!circleGeometryCache[key]) {
    const curve = new THREE.EllipseCurve(0, 0, size, size, 0, 2 * Math.PI, false, 0)
    const points = curve.getPoints(segments)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)

    const positions = geometry.attributes.position
    const lineDistances = new Float32Array(positions.count)

    const point = new THREE.Vector3()
    const prevPoint = new THREE.Vector3()

    prevPoint.fromBufferAttribute(positions, 0)
    let totalDistance = 0

    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i)

      if (i > 0) {
        totalDistance += prevPoint.distanceTo(point)
      }

      lineDistances[i] = totalDistance
      prevPoint.copy(point)
    }

    geometry.setAttribute('lineDistance', new THREE.BufferAttribute(lineDistances, 1))
    circleGeometryCache[key] = geometry
  }

  return circleGeometryCache[key]
}

export function createDashedLineMaterial(
  color: string,
  dashSize: number = 0.2,
  gapSize: number = 0.1,
): THREE.LineDashedMaterial {
  return new THREE.LineDashedMaterial({
    color: color,
    dashSize: dashSize,
    gapSize: gapSize,
    transparent: true,
  })
}

export function createAxisGeometry(length: number, tilt: number): THREE.Vector3[] {
  const tiltRad = (tilt * Math.PI) / 180

  const points: THREE.Vector3[] = []
  const startPoint = new THREE.Vector3(0, -length, 0)
  const endPoint = new THREE.Vector3(0, length, 0)

  const rotationMatrix = new THREE.Matrix4().makeRotationX(tiltRad)
  startPoint.applyMatrix4(rotationMatrix)
  endPoint.applyMatrix4(rotationMatrix)

  points.push(startPoint, endPoint)

  const arrowLength = length * 0.1
  const arrowTop = new THREE.Vector3(0, length, 0)
  const arrowLeft = new THREE.Vector3(-arrowLength * 0.5, length - arrowLength, 0)
  const arrowRight = new THREE.Vector3(arrowLength * 0.5, length - arrowLength, 0)

  arrowTop.applyMatrix4(rotationMatrix)
  arrowLeft.applyMatrix4(rotationMatrix)
  arrowRight.applyMatrix4(rotationMatrix)

  points.push(arrowTop, arrowLeft, arrowTop, arrowRight)

  return points
}

// 위치 관련 유틸리티
export function getHumanPositionOffset(targetPosition: [number, number, number]): [number, number, number] {
  const key = targetPosition.join(',')

  const offsets: { [key: string]: [number, number, number] } = {
    '5,0,0': [-0.03, 0.5, 0.15], // 오른쪽 지구
    '-5,0,0': [0.03, 0.5, 0.17], // 왼쪽 지구
    '0,0,5': [0, 0.5, 0.14], // 앞쪽 지구
    '0,0,-5': [0, 0.5, 0.17], // 뒤쪽 지구
  }

  return offsets[key] || [0, 0.5, 0.14] // 기본값
}

// 컴포넌트 정의
export function Stars({ count = 5000, size = 0.5 }: StarsProps) {
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const radius = 50
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)
    }

    return positions
  }, [count])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach={'attributes-position'} count={count} array={particlesPosition} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={size} sizeAttenuation={true} color='white' transparent={true} opacity={0.8} />
    </points>
  )
}

export function DashedSphere({
  position = [0, 0, 0],
  size = 0.1,
  color = '#FF0000',
  dashSize = 0.2,
  gapSize = 0.1,
  onClick,
  visible = true,
}: DashedSphereProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isHovered, setIsHovered] = useState(false)
  const currentColor = isHovered ? '#FF0000' : color

  const { camera } = useThree()

  const material = useMemo(() => {
    return createDashedLineMaterial(currentColor, dashSize, gapSize)
  }, [currentColor, dashSize, gapSize])

  const geometry = useMemo(() => {
    return getCircleGeometry(size)
  }, [size])

  useEffect(() => {
    document.body.style.cursor = isHovered ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [isHovered])

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData.sphereSize = size
      groupRef.current.userData.spherePosition = new THREE.Vector3(...position)
    }
  }, [position, size])

  useFrame(() => {
    if (groupRef.current && camera) {
      const worldPosition = new THREE.Vector3()
      groupRef.current.getWorldPosition(worldPosition)

      const direction = new THREE.Vector3().subVectors(camera.position, worldPosition).normalize()
      const quaternion = new THREE.Quaternion()
      const matrix = new THREE.Matrix4().lookAt(direction, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0))
      quaternion.setFromRotationMatrix(matrix)

      groupRef.current.quaternion.copy(quaternion)
    }
  })

  if (!visible) return null

  return (
    <group
      ref={groupRef}
      position={position as any}
      onClick={onClick}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      raycast={(raycaster, intersects) => {
        if (!groupRef.current) return

        const worldPosition = new THREE.Vector3()
        groupRef.current.getWorldPosition(worldPosition)

        const boundingSphere = new THREE.Sphere(worldPosition, size)
        if (raycaster.ray.intersectsSphere(boundingSphere)) {
          intersects.push({
            distance: worldPosition.distanceTo(raycaster.ray.origin),
            object: groupRef.current,
            point: new THREE.Vector3().copy(worldPosition),
          })
        }
      }}>
      <primitive object={new THREE.Line(geometry, material)} />
    </group>
  )
}

export function Sun({ onClick, onPointerOver, onPointerOut, visible = true }: SunProps) {
  const sunRef = useRef<THREE.Mesh>(null)
  const sunTexture = useTexture('/models/earth/sun_texture.jpeg')

  useFrame((_, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.05 * delta
    }
  })

  if (!visible) return null

  return (
    <mesh ref={sunRef} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        map={sunTexture || undefined}
        emissive='orange'
        emissiveIntensity={0.8}
        emissiveMap={sunTexture || undefined}
      />
    </mesh>
  )
}

export function Earth({
  position = [0, 0, 0],
  isOrbiting = true,
  speed = 0.5,
  modelPath,
  shouldRotate = true,
  visible = true,
}: EarthProps) {
  const earthGroupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTFWithCache(modelPath)
  const earthModel = useMemo(() => scene.clone(), [scene])

  const rotationSpeed = 0.001 * speed * 24

  useFrame((state) => {
    if (!earthGroupRef.current) return

    const time = state.clock.getElapsedTime()

    if (isOrbiting) {
      earthGroupRef.current.position.x = Math.cos(time * speed) * 5
      earthGroupRef.current.position.z = -Math.sin(time * speed) * 5
    } else {
      earthGroupRef.current.position.set(position[0], position[1], position[2])
    }

    if (shouldRotate) {
      earthModel.rotation.y += rotationSpeed
    }
  })

  if (!visible) return null

  return (
    <group ref={earthGroupRef}>
      <primitive object={earthModel} scale={[0.1, 0.1, 0.1]} />
    </group>
  )
}

export function RotationAxis({ position = [0, 0, 0], length = 1.2, tilt = 23.5 }: RotationAxisProps) {
  const axisPoints = useMemo(() => {
    return createAxisGeometry(length, tilt)
  }, [length, tilt])

  return (
    <group position={position as any}>
      <Line points={axisPoints.slice(0, 2)} color='red' lineWidth={1} />

      <Line points={axisPoints.slice(0, 2)} color='red' lineWidth={1} />
    </group>
  )
}

export function HumanModel({ position, visible, scale = 0.004, rotation = [0, Math.PI, 0] }: HumanModelProps) {
  const modelRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/earth/Figure.gltf')
  const model = useMemo(() => scene.clone(), [scene])

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.visible = visible !== undefined ? visible : true
    }
  }, [visible])

  return (
    <group
      ref={modelRef}
      position={position as any}
      scale={[scale, scale, scale]}
      rotation={rotation as any}
      visible={visible}>
      <primitive object={model} />
    </group>
  )
}
export function LargeSphere({ position, visible }: LargeSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const opacityRef = useRef(0)
  const sunTexture = useTexture('/models/earth/sky.png')
  const innerTexture = useTexture('/models/earth/Panorama.png') // 투명 PNG 텍스처
  const { gl } = useThree()

  const clippingPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])

  useEffect(() => {
    gl.localClippingEnabled = true
  }, [gl])

  useFrame(() => {
    if (!meshRef.current || !meshRef.current.material) return
    const material = meshRef.current.material as THREE.MeshBasicMaterial

    const targetOpacity = visible ? 1 : 0
    const step = 0.01

    if (opacityRef.current < targetOpacity) {
      opacityRef.current = Math.min(opacityRef.current + step, targetOpacity)
    } else if (opacityRef.current > targetOpacity) {
      opacityRef.current = Math.max(opacityRef.current - step, targetOpacity)
    }

    material.opacity = opacityRef.current
    meshRef.current.visible = opacityRef.current > 0
  })

  return (
    <group position={position as any}>
      {/* 바깥 반구 */}
      <mesh ref={meshRef} rotation={[0, -Math.PI / 2, 0]}> 
        <sphereGeometry args={[10, 32, 32]} />
        <meshStandardMaterial
          map={sunTexture || undefined}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={visible ? 1 : 0}
          emissive={new THREE.Color('#000')}
          emissiveIntensity={0.4}
          clippingPlanes={[clippingPlane]}
          clipShadows={true}
        />
      </mesh>


      {/* 안쪽 sphere (조금 더 작고 투명 PNG 텍스처 적용) */}
      <mesh visible={visible}>
        <sphereGeometry args={[9.8, 32, 32]}/>
        <meshBasicMaterial
          map={innerTexture}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={1.0}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
