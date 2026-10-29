import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Bloom, DepthOfField, EffectComposer, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import Env from './Env'
import { FOCUS_POINTS } from '../data/focusPoints'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { STICKERS, makeStickerTexture } from './stickers'
import { createPaintedEyes, paintEye } from './eyes'

useGLTF.preload(`${import.meta.env.BASE_URL}models/me.glb`)

const POINTS = FOCUS_POINTS as readonly string[]
const NODE_LINE = 0.3
const MODEL_HEIGHT = 5.8
const MODEL_BOTTOM = -3.1
const BASE_YAW = -Math.PI / 2
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const HEAD_PIVOT = new THREE.Vector3(0.06, 0.17, 0)

type CameraPreset = {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

const HERO_WIDE: CameraPreset = { position: [0, -1.2, 21], target: [0, -1.2, 1.6], fov: 23 }
const HERO_NARROW: CameraPreset = { position: [0, 0.1, 19], target: [0, 0.1, 1.6], fov: 23 }
const FALLBACK: CameraPreset = { position: [0, 0.9, 7], target: [0, 0.9, 1], fov: 30 }

type Anchor = { point: THREE.Vector3; normal: THREE.Vector3; focus?: number }

function firstMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null
  root.traverse((object: any) => {
    if (!found && object.isMesh) found = object
  })
  return found
}

// Ray-casts each sticker spot onto the face from the front and projects it as a decal.
function applyStickers(root: THREE.Object3D, mesh: THREE.Mesh): Anchor[] {
  root.updateMatrixWorld(true)
  const raycaster = new THREE.Raycaster()
  const helper = new THREE.Object3D()
  const forward = new THREE.Vector3(1, 0, 0)
  const anchors: Anchor[] = []
  for (const sticker of STICKERS) {
    raycaster.set(new THREE.Vector3(2, sticker.y, sticker.z), new THREE.Vector3(-1, 0, 0))
    const hit = raycaster.intersectObject(mesh, false)[0]
    if (!hit?.face) continue
    const normal = hit.face.normal.clone().transformDirection(mesh.matrixWorld).lerp(forward, 0.3).normalize()
    helper.position.copy(hit.point)
    helper.lookAt(hit.point.clone().add(normal))
    helper.rotateZ(sticker.tilt)
    const { texture, aspect } = makeStickerTexture(sticker.design)
    const geometry = new DecalGeometry(mesh, hit.point, helper.rotation, new THREE.Vector3(sticker.size, sticker.size / aspect, 0.06))
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.05,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      roughness: 0.32,
      metalness: 0,
    })
    const decal = new THREE.Mesh(geometry, material)
    decal.renderOrder = 2
    decal.receiveShadow = true
    root.add(decal)
    anchors.push({ point: hit.point.clone(), normal, focus: sticker.focus })
  }
  return anchors
}

function toWorld(local: THREE.Vector3, offset: THREE.Vector3, scale: number) {
  return local.clone().applyAxisAngle(Y_AXIS, BASE_YAW).multiplyScalar(scale).add(offset)
}

function stickerPreset(point: THREE.Vector3, normal: THREE.Vector3, index: number, narrow: boolean): CameraPreset {
  if (narrow) {
    // Phones: sticker centred in the top part of the screen, above the timeline card.
    const target = point.clone().add(new THREE.Vector3(0, -0.75, 0))
    const position = target.clone().add(normal.clone().multiplyScalar(3.2)).add(new THREE.Vector3(0, 0.15, 0))
    return { position: position.toArray() as CameraPreset['position'], target: target.toArray() as CameraPreset['target'], fov: 30 }
  }
  // Desktop: aim to the right of the sticker so it sits left of centre, clear of the timeline text.
  const target = point.clone().add(new THREE.Vector3(0.42, 0, 0))
  const side = index % 2 === 0 ? 0.15 : -0.15
  const position = target.clone().add(normal.clone().multiplyScalar(2.3)).add(new THREE.Vector3(side, 0.12, 0))
  return { position: position.toArray() as CameraPreset['position'], target: target.toArray() as CameraPreset['target'], fov: 30 }
}

function buildPresets(anchors: Anchor[], offset: THREE.Vector3, scale: number, narrow: boolean): CameraPreset[] {
  const entries = POINTS.map((_, index) => {
    const anchor = anchors.find((a) => a.focus === index)
    if (!anchor) return FALLBACK
    return stickerPreset(toWorld(anchor.point, offset, scale), anchor.normal.clone().applyAxisAngle(Y_AXIS, BASE_YAW), index, narrow)
  })
  return [narrow ? HERO_NARROW : HERO_WIDE, ...entries]
}

// Works section: the camera swings around the head from a three-quarter view to a full profile
// while the gallery scrolls sideways.
function worksPreset(pivot: THREE.Vector3, progress: number, narrow: boolean): CameraPreset {
  // Negative angles orbit to the viewer's left, so the profile faces into the cards on the right.
  const angle = THREE.MathUtils.lerp(-0.3, -1.45, progress)
  const radius = narrow ? 10 : 9
  const position = pivot.clone().add(new THREE.Vector3(Math.sin(angle) * radius, 0.35, Math.cos(angle) * radius))
  const right = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle))
  const target = narrow ? pivot.clone().add(new THREE.Vector3(0, -1.1, 0)) : pivot.clone().add(right.multiplyScalar(1.35))
  return { position: position.toArray() as CameraPreset['position'], target: target.toArray() as CameraPreset['target'], fov: 30 }
}

function GradientBackground() {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color('#b9c7a8') },
      uMid: { value: new THREE.Color('#97ab8c') },
      uBottom: { value: new THREE.Color('#6d8466') },
      uSheen: { value: new THREE.Color('#e8e0b8') },
      uSteep: { value: 1.08 },
    }),
    []
  )

  return (
    <mesh scale={100}>
      <sphereGeometry args={[1, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'}
        fragmentShader={'uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBottom; uniform vec3 uSheen; uniform float uSteep; varying vec3 vDir; void main() { float t = clamp(vDir.y * uSteep * 0.5 + 0.5, 0.0, 1.0); vec3 lower = mix(uBottom, uMid, smoothstep(0.0, 0.62, t)); vec3 color = mix(lower, uTop, smoothstep(0.42, 1.0, t)); float diagonal = vDir.x * 0.72 + vDir.y * 0.48; float sheen = smoothstep(0.18, 0.48, diagonal) - smoothstep(0.48, 0.78, diagonal); color += uSheen * sheen * 0.16; gl_FragColor = vec4(color, 1.0); }'}
      />
    </mesh>
  )
}

function Lights({ lowPower }: { lowPower: boolean }) {
  return (
    <>
      <Env intensity={0.45} />
      <hemisphereLight args={['#fff6e8', '#4f6248', 0.45]} />
      <directionalLight position={[4, 6, 6]} intensity={1.7} color="#ffe2c8" castShadow={!lowPower} shadow-mapSize={[lowPower ? 512 : 2048, lowPower ? 512 : 2048]} />
      <directionalLight position={[-6, 2, 3]} intensity={0.45} color="#c9dcff" />
      <directionalLight position={[0, 5, -6]} intensity={1.6} color="#f3ffe4" />
    </>
  )
}

function StaticCharacter({ focusRef, frameRef }: { focusRef: MutableRefObject<THREE.Vector3>; frameRef: MutableRefObject<number> }) {
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}models/me.glb`)
  const { model, offset, scale, wide, narrow, eyes, mesh, pivot } = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((object: THREE.Object3D) => {
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    const box = new THREE.Box3().setFromObject(clone)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = MODEL_HEIGHT / Math.max(size.y, 0.001)
    const offset = new THREE.Vector3(-center.x * scale, MODEL_BOTTOM - box.min.y * scale, -center.z * scale)
    const mesh = firstMesh(clone)
    // Tripo exports metalness 1 scaled by a noisy map, which turns skin and eyes into glassy glare.
    if (mesh) (mesh.material as THREE.MeshStandardMaterial).metalness = 0
    const anchors = mesh ? applyStickers(clone, mesh) : []
    const eyes = mesh ? createPaintedEyes(mesh) : []
    return {
      model: clone,
      offset,
      scale,
      eyes,
      mesh,
      pivot: toWorld(HEAD_PIVOT, offset, scale),
      wide: buildPresets(anchors, offset, scale, false),
      narrow: buildPresets(anchors, offset, scale, true),
    }
  }, [scene])

  const get = useThree((state) => state.get)
  const scrollTargets = useRef<HTMLElement[] | null>(null)
  const worksEl = useRef<HTMLElement | null>(null)
  const current = useRef(0)
  const desiredPosition = useRef(new THREE.Vector3())
  const desiredTarget = useRef(new THREE.Vector3())
  const lookAtMatrix = useRef(new THREE.Matrix4())
  const desiredQuaternion = useRef(new THREE.Quaternion())

  useEffect(() => {
    scrollTargets.current = null
    worksEl.current = null
  }, [])

  useFrame((_, delta) => {
    if (!scrollTargets.current || scrollTargets.current.length !== POINTS.length) {
      scrollTargets.current = POINTS.map((point) => document.querySelector(`[data-point="${point}"]`)).filter(Boolean) as HTMLElement[]
    }
    if (!worksEl.current) worksEl.current = document.querySelector('.wk-gallery') as HTMLElement | null

    const camera = get().camera as THREE.PerspectiveCamera
    const isNarrow = camera.aspect < 0.85
    const presets = isNarrow ? narrow : wide
    const last = presets.length

    let targetIndex = 0
    const entries = scrollTargets.current
    if (entries.length === POINTS.length) {
      const referenceLine = window.scrollY + window.innerHeight * NODE_LINE
      const tops = entries.map((entry) => entry.getBoundingClientRect().top + window.scrollY)
      if (referenceLine <= tops[0]) {
        // The hero shot starts where the model is revealed (below the opening cover), not at the page top.
        const heroTop = (document.querySelector('.hero') as HTMLElement | null)?.offsetTop ?? 0
        const span = Math.max(1, tops[0] - window.innerHeight * NODE_LINE - heroTop)
        targetIndex = THREE.MathUtils.clamp((window.scrollY - heroTop) / span, 0, 1)
      } else if (referenceLine >= tops[tops.length - 1]) {
        targetIndex = POINTS.length
      } else {
        for (let index = 0; index < tops.length - 1; index += 1) {
          if (referenceLine <= tops[index + 1]) {
            targetIndex = index + 1 + (referenceLine - tops[index]) / Math.max(1, tops[index + 1] - tops[index])
            break
          }
        }
      }
    }

    let worksProgress = 0
    const works = worksEl.current
    if (works) {
      const rect = works.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.55) targetIndex = last
      worksProgress = THREE.MathUtils.clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1)
    }
    const presetAt = (i: number) => (i >= last ? worksPreset(pivot, worksProgress, isNarrow) : presets[i])

    const smoothing = 1 - Math.pow(0.12, delta)
    current.current += (targetIndex - current.current) * smoothing
    const safeIndex = THREE.MathUtils.clamp(current.current, 0, last)
    const lower = Math.floor(safeIndex)
    const upper = Math.min(lower + 1, last)
    const progress = safeIndex - lower
    const from = presetAt(lower)
    const to = presetAt(upper)

    desiredPosition.current.fromArray(from.position).lerp(new THREE.Vector3().fromArray(to.position), progress)
    desiredTarget.current.fromArray(from.target).lerp(new THREE.Vector3().fromArray(to.target), progress)
    const fov = THREE.MathUtils.lerp(from.fov, to.fov, progress)
    camera.position.lerp(desiredPosition.current, smoothing)
    focusRef.current.lerp(desiredTarget.current, smoothing)
    lookAtMatrix.current.lookAt(camera.position, focusRef.current, camera.up)
    desiredQuaternion.current.setFromRotationMatrix(lookAtMatrix.current)
    camera.quaternion.slerp(desiredQuaternion.current, smoothing)
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, fov, smoothing)
      camera.updateProjectionMatrix()
    }
    frameRef.current = safeIndex
  })

  // The HTML overlay sits above the canvas, so R3F never sees the mouse: listen on the window.
  const pointer = useRef({ x: 0, y: 0, smoothX: 0, smoothY: 0, lastMove: -100 })
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1)
      pointer.current.lastMove = performance.now() / 1000
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
    }
  }, [])

  const headRef = useRef<THREE.Group>(null)
  const gaze = useRef({ nextJump: 0, jx: 0, jy: 0, nextBlink: 2, blinkStart: -1, doubleBlink: false, dir: new THREE.Vector3(1, 0, 0) })
  const tmp = useMemo(() => ({ ray: new THREE.Vector3(), forward: new THREE.Vector3(), eyePos: new THREE.Vector3(), target: new THREE.Vector3(), local: new THREE.Vector3() }), [])
  useFrame((state, delta) => {
    const head = headRef.current
    if (!head) return
    const t = state.clock.elapsedTime
    const p = pointer.current
    const idle = performance.now() / 1000 - p.lastMove > 3
    const pk = 1 - Math.pow(0.004, delta)
    p.smoothX += ((idle ? 0 : p.x) - p.smoothX) * pk
    p.smoothY += ((idle ? 0 : p.y) - p.smoothY) * pk

    // Full head-follow on the hero shot; calmer during sticker close-ups and the works orbit.
    const k = 1 - Math.pow(0.02, delta)
    const amp = frameRef.current < 0.6 ? 1 : 0.12
    const idleYaw = Math.sin(t * 0.37) * 0.07 + Math.sin(t * 0.91) * 0.025
    const idlePitch = Math.sin(t * 0.53) * 0.03
    head.rotation.y += (BASE_YAW + (p.smoothX * 0.18 + idleYaw) * amp - head.rotation.y) * k
    head.rotation.x += ((-p.smoothY * 0.04 + idlePitch) * amp - head.rotation.x) * k
    head.rotation.z = Math.sin(t * 0.29) * 0.015 * amp
    const breath = Math.sin(t * 1.35)
    head.position.y = breath * 0.004
    head.scale.set(1 + breath * 0.004, 1 + breath * 0.002, 1 + breath * 0.004)
    head.updateMatrixWorld(true)

    // Gaze target: where the cursor ray crosses a plane just in front of the face, or the
    // viewer's eyes when the mouse has been still (always the case on phones between touches).
    const g = gaze.current
    if (t > g.nextJump) {
      g.jx = (Math.random() - 0.5) * 0.12
      g.jy = (Math.random() - 0.5) * 0.08
      g.nextJump = t + 0.6 + Math.random() * 2.4
    }
    const camera = state.camera
    camera.getWorldDirection(tmp.forward)
    if (!mesh || eyes.length === 0) return
    // Start from eye contact with the viewer, then turn toward the cursor by how far it is from
    // the eyes on screen: cursor on the face = looking at you, cursor at the edge = looking over there.
    const mid = eyes.reduce((sum, eye) => sum.add(eye.center), new THREE.Vector3()).divideScalar(eyes.length)
    mesh.localToWorld(tmp.eyePos.copy(mid))
    const eyeNdc = tmp.eyePos.clone().project(camera)
    const ox = (idle ? 0 : p.x - eyeNdc.x) + g.jx * 0.5
    const oy = (idle ? 0 : p.y - eyeNdc.y) + g.jy * 0.5
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
    tmp.ray.copy(camera.position).sub(tmp.eyePos).normalize().addScaledVector(right, ox * 0.9).addScaledVector(up, oy * 0.9)
    tmp.target.copy(tmp.eyePos).add(tmp.ray)

    // Blinks every few seconds, sometimes a quick double blink.
    if (t > g.nextBlink && g.blinkStart < 0) {
      g.blinkStart = t
      g.doubleBlink = Math.random() < 0.2
    }
    let blink = 0
    if (g.blinkStart >= 0) {
      const dt = t - g.blinkStart
      const length = g.doubleBlink ? 0.42 : 0.17
      if (dt > length) {
        g.blinkStart = -1
        g.nextBlink = t + 2.2 + Math.random() * 4
      } else {
        const phase = g.doubleBlink ? (dt % 0.21) / 0.21 : dt / 0.17
        blink = Math.sin(phase * Math.PI)
      }
    }

    // One shared direction from between the eyes, so they never cross; eased for a smooth follow.
    mesh.worldToLocal(tmp.local.copy(tmp.target))
    const want = tmp.local.sub(mid)
    if (want.x < 0.01) want.x = 0.01
    const ek = 1 - Math.pow(0.002, delta)
    g.dir.lerp(want.normalize(), ek)
    for (const eye of eyes) paintEye(eye, g.dir, blink)
  })

  return (
    <group position={offset} scale={scale}>
      <group ref={headRef} rotation={[0, BASE_YAW, 0]}>
        <primitive object={model} />
      </group>
    </group>
  )
}

function Post({ focusRef, lowPower }: { focusRef: MutableRefObject<THREE.Vector3>; lowPower: boolean }) {
  const dofRef = useRef<any>(null)
  useFrame(() => {
    if (dofRef.current?.target) dofRef.current.target.copy(focusRef.current)
  })
  return (
    <EffectComposer multisampling={0} stencilBuffer={false} depthBuffer>
      {(!lowPower ? <DepthOfField ref={dofRef} target={[0, 0.35, 0]} worldFocusRange={1.5} bokehScale={4.5} height={480} /> : null) as any}
      <Bloom mipmapBlur={!lowPower} intensity={lowPower ? 0.15 : 0.25} luminanceThreshold={0.95} luminanceSmoothing={0.2} />
      {(!lowPower ? <SMAA /> : null) as any}
    </EffectComposer>
  )
}

export default function Scene({ lowPower }: { lowPower: boolean }) {
  const focusRef = useRef(new THREE.Vector3(0, 0.35, 0))
  const frameRef = useRef(0)
  return (
    <>
      <GradientBackground />
      <Suspense fallback={null}>
        <Lights lowPower={lowPower} />
        <StaticCharacter focusRef={focusRef} frameRef={frameRef} />
      </Suspense>
      <Post focusRef={focusRef} lowPower={lowPower} />
    </>
  )
}
