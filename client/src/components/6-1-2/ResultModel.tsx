import { useGLTF } from '@react-three/drei'
import { GroupProps } from '@react-three/fiber'
import { useEffect } from 'react'
import { Mesh } from 'three'

interface ResultModelProps extends GroupProps {
  castShadow?: boolean
  receiveShadow?: boolean
}

export default function ResultModel({
  castShadow = true,
  receiveShadow = true,
  ...props
}: ResultModelProps) {
  // 두 개의 GLTF 파일을 로드
  const objectsModel = useGLTF('models/6-1-2/ResultsObjects/Result_Objects.gltf')
  const numbersModel = useGLTF('models/6-1-2/ResultsNumbers/Result_Numbers.gltf')

  useEffect(() => {
    // 객체 모델에 그림자 설정 적용
    if (objectsModel.scene) {
      objectsModel.scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = castShadow
          child.receiveShadow = receiveShadow
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshLambertMaterial) {
                  mat.needsUpdate = true
                }
              })
            } else {
              if (child.material.isMeshStandardMaterial || child.material.isMeshPhongMaterial || child.material.isMeshLambertMaterial) {
                child.material.needsUpdate = true
              }
            }
          }
        }
      })
    }

    // 숫자 모델에 그림자 설정 적용
    if (numbersModel.scene) {
      numbersModel.scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = castShadow
          child.receiveShadow = receiveShadow
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat.isMeshStandardMaterial || mat.isMeshPhongMaterial || mat.isMeshLambertMaterial) {
                  mat.needsUpdate = true
                }
              })
            } else {
              if (child.material.isMeshStandardMaterial || child.material.isMeshPhongMaterial || child.material.isMeshLambertMaterial) {
                child.material.needsUpdate = true
              }
            }
          }
        }
      })
    }
  }, [objectsModel.scene, numbersModel.scene, castShadow, receiveShadow])

  return (
    <group {...props}>
      <primitive object={objectsModel.scene} />
      <primitive object={numbersModel.scene} />
    </group>
  )
}

// 프리로드를 위한 설정
useGLTF.preload('models/6-1-2/ResultsObjects/Result_Objects.gltf')
useGLTF.preload('models/6-1-2/ResultsNumbers/Result_Numbers.gltf')