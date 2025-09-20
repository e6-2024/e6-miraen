import * as THREE from 'three'

export type ClipRef = number | string

const resolveIndex = (animations: THREE.AnimationClip[], ref: ClipRef) =>
  typeof ref === 'number' ? ref : animations.findIndex((c) => c.name === ref)

export const playClip = (mixer: THREE.AnimationMixer | null, animations: THREE.AnimationClip[], ref: ClipRef) => {
  if (!mixer || !animations?.length) return
  const idx = resolveIndex(animations, ref)
  if (idx < 0) return
  const clip = animations[idx]
  const action = mixer.clipAction(clip)
  action.enabled = true
  action.paused = false
  action.setEffectiveTimeScale(1)
  action.setLoop(THREE.LoopOnce, 0)
  action.clampWhenFinished = true
  action.reset()
  action.play()
}

export const setClipToEnd = (mixer: THREE.AnimationMixer | null, animations: THREE.AnimationClip[], ref: ClipRef) => {
  if (!mixer || !animations?.length) return
  const idx = resolveIndex(animations, ref)
  if (idx < 0) return
  const clip = animations[idx]
  const action = mixer.clipAction(clip)
  action.enabled = true
  action.setLoop(THREE.LoopOnce, 0)
  action.clampWhenFinished = true
  action.reset()
  action.play()
  action.time = Math.max(clip.duration - 1e-6, 0)
  action.paused = true
  mixer.update(0)
}

export const setClipsToEnd = (mixer: THREE.AnimationMixer | null, animations: THREE.AnimationClip[], refs: ClipRef[]) => {
  refs.forEach((r) => setClipToEnd(mixer, animations, r))
}

export interface PartialGuard {
  action: THREE.AnimationAction
  endTime: number
  done: boolean
}

export const startPartialClip = (
  mixer: THREE.AnimationMixer | null,
  animations: THREE.AnimationClip[],
  ref: ClipRef,
  startRatio: number,
  endRatio: number
): PartialGuard | null => {
  if (!mixer || !animations?.length) return null
  const idx = resolveIndex(animations, ref)
  if (idx < 0) return null

  const clip = animations[idx]
  const action = mixer.clipAction(clip)

  const s = THREE.MathUtils.clamp(startRatio, 0, 1)
  const e = THREE.MathUtils.clamp(endRatio, 0, 1)
  if (e <= s) return null

  const startTime = clip.duration * s
  const endTime = clip.duration * e

  action.enabled = true
  action.setLoop(THREE.LoopOnce, 0)
  action.clampWhenFinished = true
  action.reset()
  action.play()
  action.paused = false
  action.setEffectiveTimeScale(1)
  action.time = startTime

  return { action, endTime, done: false }
}

export const tickPartialGuards = (guards: PartialGuard[]) => {
  const EPS = 1e-4
  for (const g of guards) {
    if (g.done) continue
    if (g.action.time + EPS >= g.endTime) {
      g.action.time = g.endTime
      g.action.paused = true
      g.action.setEffectiveTimeScale(0)
      g.done = true
    }
  }
}
