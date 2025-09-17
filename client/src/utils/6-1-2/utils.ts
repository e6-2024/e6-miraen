import * as THREE from 'three'
import { Vehicle, VehicleId, VehicleCameraConfig } from '@/types/6-1-2/types'

export const VEHICLE_SPEEDS = {
  train: 3000,
  car: 70,
  horse: 60,
  bicycle: 30,
  runner: 20,
}

export const VEHICLES: Vehicle[] = [
  { id: 'train', name: '기차', speed: VEHICLE_SPEEDS.train, meshName: 'RB_Handlebar', audioPath: '/sounds/6-1-2/train.mp3' },
  { id: 'car', name: '자동차', speed: VEHICLE_SPEEDS.car, meshName: 'RB_Handlebar', audioPath: '/sounds/6-1-2/car.mp3' },
  { id: 'horse', name: '말', speed: VEHICLE_SPEEDS.horse, meshName: 'Horse_fur', audioPath: '/sounds/6-1-2/horse.mp3' },
  {
    id: 'bicycle',
    name: '자전거',
    speed: VEHICLE_SPEEDS.bicycle,
    meshName: 'Male_Head',
    audioPath: '/sounds/6-1-2/bicycle.mp3',
  },
  {
    id: 'runner',
    name: '달리는 사람',
    speed: VEHICLE_SPEEDS.runner,
    meshName: 'female_genericMesh2',
    audioPath: '/sounds/6-1-2/runner.mp3',
  },
]

export const CAMERA_CONFIGS: Record<VehicleId, VehicleCameraConfig> = {
  train: {
    offset: { x: -0.06, y: 0.08, z: -1.45 },
    lookAheadDistance: 1.0,
  },
  car: {
    offset: { x: -0.12, y: 0.2, z: -0.72 },
    lookAheadDistance: 1.5,
  },
  horse: {
    offset: { x: 0, y: 0.32, z: -0.6 },
    lookAheadDistance: 1.2,
  },
  bicycle: {
    offset: { x: 0, y: 0.2, z: -0.5 },
    lookAheadDistance: 1.0,
  },
  runner: {
    offset: { x: 0, y: 0.2, z: -0.2 },
    lookAheadDistance: 0.8,
  },
}

export const CAMERA_POSITIONS = {
  start: [2.078, 1.235, -4.222] as [number, number, number],
  approaching: [1.0, 0.8, 39.7] as [number, number, number],
  result: [2.078, 1.235, -4.222] as [number, number, number],
}

export const CAMERA_TARGETS = {
  start: [0, 0, 0] as [number, number, number],
  approaching: [1.0, 0, 37] as [number, number, number],
  result: [0, 0, 0] as [number, number, number],
}

export const findVehicleById = (id: VehicleId): Vehicle | undefined => {
  return VEHICLES.find((vehicle) => vehicle.id === id)
}

export const getVehiclePosition = (sceneRef: React.RefObject<THREE.Group>, vehicleId: VehicleId): THREE.Vector3 => {
  if (!sceneRef.current) return new THREE.Vector3(0, 0, 0)

  const vehicle = findVehicleById(vehicleId)
  if (!vehicle) return new THREE.Vector3(0, 0, 0)

  let vehicleObject: THREE.Object3D | null = null
  sceneRef.current.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name === vehicle.meshName) {
      vehicleObject = child
    }
  })

  if (vehicleObject) {
    const position = new THREE.Vector3()
    vehicleObject.getWorldPosition(position)
    return position
  }
  return new THREE.Vector3(0, 0, 0)
}

export const calculateFirstPersonCamera = (
  vehiclePosition: THREE.Vector3,
  vehicleId: VehicleId,
): { position: THREE.Vector3; lookAtTarget: THREE.Vector3 } => {
  const config = CAMERA_CONFIGS[vehicleId]

  const cameraPosition = new THREE.Vector3(
    vehiclePosition.x + config.offset.x,
    vehiclePosition.y + config.offset.y,
    vehiclePosition.z + config.offset.z,
  )

  const lookAtTarget = new THREE.Vector3(
    vehiclePosition.x,
    vehiclePosition.y + config.offset.y - 0.05,
    vehiclePosition.z + config.lookAheadDistance,
  )

  return { position: cameraPosition, lookAtTarget }
}
