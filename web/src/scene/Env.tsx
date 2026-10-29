import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as THREE from 'three'

// Image-based lighting from three.js's procedural studio room: soft reflections with no HDR file
// to license or download.
export default function Env({ intensity }: { intensity: number }) {
  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const target = pmrem.fromScene(room, 0.04)
    scene.environment = target.texture
    return () => {
      scene.environment = null
      target.dispose()
      room.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  useEffect(() => {
    scene.environmentIntensity = intensity
  }, [scene, intensity])

  return null
}
