export const SIEVE_CONFIG = {
  LEVELS: [
    {
      level: 0,
      title: '눈의 크기가 큰 구슬보다 큰 체',
      color: 'from-red-200 to-red-400',
    },
    {
      level: 2,
      title: '눈의 크기가 큰 구슬보다 작고 작은 구슬보다 큰 체',
      color: 'from-green-200 to-green-400',
    },
    {
      level: 1,
      title: '눈의 크기가 작은 구슬보다 작은 체',
      color: 'from-blue-200 to-blue-400',
    },
  ],
} as const;

export const PARTICLE_CONFIG = {
  LARGE: {
    radius: 0.35,
    mass: 1.5,
    color: 'orange',
  },
  SMALL: {
    radius: 0.15,
    mass: 0.8,
    color: 'limegreen',
  },
  SPAWN: {
    count: 40,
    batchSize: 10,
    interval: 10,
    spread: 1.2,
    height: 8,
  },
} as const;

export const PHYSICS_CONFIG = {
  gravity: [0, -9.81, 0] as [number, number, number],
  tiltLimit: 0.15,
  sensitivity: 1.0,
  friction: 0.2,
  restitution: 0.2,
} as const;

export const SIEVE_DIMENSIONS = {
  radius: 3.0,
  height: 8,
  thickness: 0.15,
  segments: 16,
} as const;

export const CONTAINER_DIMENSIONS = {
  size: 20,
  wallThickness: 0.2,
  wallHeight: 2,
  bottomY: -7,
} as const;