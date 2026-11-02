import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
import { Bloom, DepthOfField, EffectComposer, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import Env from './Env'
import { TOUR } from '../data/tour'
import { useTour } from '../store'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { layout, makeStickerTexture, type Sticker } from './stickers'
import { EDITING, useEditor } from '../editor'
import { createPaintedEyes, paintEye } from './eyes'
import { boot, useModelUrl } from './modelSource'

const MODEL_HEIGHT = 5.8
const MODEL_BOTTOM = -3.1
const BASE_YAW = -Math.PI / 2
const Y_AXIS = new THREE.Vector3(0, 1, 0)
const NARROW_FOV = 30
// Sticker height on phone screens in NDC (+1 = top edge): 0.5 is a quarter of the way down.
const NARROW_STICKER_Y = 0.5

type CameraPreset = {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

// Opening shot. Desktop: the camera sits to the right so the model stands left of the tour card.
// Phones: it looks low so the model fills the top of the screen above the card.
const HERO_WIDE: CameraPreset = { position: [2.2, -1.2, 21], target: [2.2, -1.2, 1.6], fov: 23 }
const HERO_NARROW: CameraPreset = { position: [0, -2.1, 21], target: [0, -2.1, 1.6], fov: 30 }
// Seconds per flight between steps; the camera eases out, pulls back a little and lands.
const FLIGHT = 1.6
const FALLBACK: CameraPreset = { position: [0, 0.9, 7], target: [0, 0.9, 1], fov: 30 }

type Anchor = { point: THREE.Vector3; normal: THREE.Vector3; focus?: number }

function firstMesh(root: THREE.Object3D): THREE.Mesh | null {
  let found: THREE.Mesh | null = null
  root.traverse((object: any) => {
    if (!found && object.isMesh) found = object
  })
  return found
}

// Ray-casts a sticker's spot onto the model from the front and projects it there as a decal.
// `material` reuses an existing sticker's texture when the editor moves it.
function makeDecal(mesh: THREE.Mesh, sticker: Sticker, material?: THREE.MeshStandardMaterial) {
  const raycaster = new THREE.Raycaster()
  const helper = new THREE.Object3D()
  const forward = new THREE.Vector3(1, 0, 0)
  raycaster.set(new THREE.Vector3(2, sticker.y, sticker.z), new THREE.Vector3(-1, 0, 0))
  const hit = raycaster.intersectObject(mesh, false)[0]
  if (!hit?.face) return null
  const normal = hit.face.normal.clone().transformDirection(mesh.matrixWorld).lerp(forward, 0.3).normalize()
  helper.position.copy(hit.point)
  helper.lookAt(hit.point.clone().add(normal))
  helper.rotateZ(sticker.tilt)
  let aspect: number
  if (!material) {
    const made = makeStickerTexture(sticker.design)
    aspect = made.aspect
    material = new THREE.MeshStandardMaterial({
      map: made.texture,
      transparent: true,
      alphaTest: 0.05,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      roughness: 0.32,
      metalness: 0,
    })
  } else {
    const image = material.map!.image as HTMLCanvasElement
    aspect = image.width / image.height
  }
  const geometry = new DecalGeometry(mesh, hit.point, helper.rotation, new THREE.Vector3(sticker.size, sticker.size / aspect, 0.06))
  const decal = new THREE.Mesh(geometry, material)
  decal.renderOrder = 2
  decal.receiveShadow = true
  return { decal, point: hit.point.clone(), normal }
}

function applyStickers(root: THREE.Object3D, mesh: THREE.Mesh, stickers: Sticker[]) {
  root.updateMatrixWorld(true)
  const anchors: Anchor[] = []
  const decals = new Map<string, THREE.Mesh>()
  for (const sticker of stickers) {
    const made = makeDecal(mesh, sticker)
    if (!made) continue
    root.add(made.decal)
    decals.set(sticker.id, made.decal)
    anchors.push({ point: made.point, normal: made.normal, focus: sticker.focus })
  }
  return { anchors, decals }
}

function toWorld(local: THREE.Vector3, offset: THREE.Vector3, scale: number) {
  return local.clone().applyAxisAngle(Y_AXIS, BASE_YAW).multiplyScalar(scale).add(offset)
}

const asPreset = (position: THREE.Vector3, target: THREE.Vector3, fov: number): CameraPreset => ({
  position: position.toArray() as CameraPreset['position'],
  target: target.toArray() as CameraPreset['target'],
  fov,
})

const centerOf = (points: THREE.Vector3[]) => points.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(points.length)
const radiusOf = (points: THREE.Vector3[]) => {
  const center = centerOf(points)
  return Math.max(...points.map((p) => p.distanceTo(center)))
}

// Frames one or more stickers, looking along their average normal. A single sticker gets a
// close-up; a group is seen from a distance set by `radius` (see buildPresets).
function stickersPreset(points: THREE.Vector3[], normals: THREE.Vector3[], radius: number, index: number, narrow: boolean): CameraPreset {
  const center = centerOf(points)
  const normal = normals.reduce((sum, n) => sum.add(n), new THREE.Vector3()).normalize()
  if (narrow) {
    // Phones: the tour card fills the lower half, so the stickers sit in the upper quarter.
    // Aiming below them by (screen offset × visible half-height) puts them there at any distance.
    const distance = Math.max(3.4, radius * 13)
    const drop = distance * Math.tan(THREE.MathUtils.degToRad(NARROW_FOV / 2)) * NARROW_STICKER_Y
    const target = center.clone().add(new THREE.Vector3(0, -drop, 0))
    return asPreset(target.clone().add(normal.clone().multiplyScalar(distance)), target, NARROW_FOV)
  }
  // Desktop: aim to the right of the stickers so they sit left of centre, clear of the tour card.
  const distance = Math.max(2.3, radius * 5.6)
  // Shifted along the camera's own right, so it works for groups seen at an angle too.
  const right = new THREE.Vector3().crossVectors(Y_AXIS, normal).normalize()
  const target = center.clone().add(right.multiplyScalar(points.length > 1 ? distance * 0.14 : 0.42))
  const side = index % 2 === 0 ? 0.15 : -0.15
  const position = target.clone().add(normal.clone().multiplyScalar(distance)).add(new THREE.Vector3(side, 0.12, 0))
  return asPreset(position, target, 30)
}

// One camera preset per tour step (see `camera` in data/tour.ts).
function buildPresets(anchors: Anchor[], offset: THREE.Vector3, scale: number, narrow: boolean): CameraPreset[] {
  const shots = TOUR.map((step) => {
    if (step.camera === 'hero') return null
    const ids = step.camera
    const picked = anchors.filter((a) => a.focus !== undefined && ids.includes(a.focus))
    return {
      points: picked.map((a) => toWorld(a.point, offset, scale)),
      normals: picked.map((a) => a.normal.clone().applyAxisAngle(Y_AXIS, BASE_YAW)),
    }
  })
  // Every group shot comes in as close as the tightest group (the companies), so the stickers
  // look the same size from step to step; a wider group simply runs past the edges.
  const groupRadius = Math.min(...shots.flatMap((shot) => (shot && shot.points.length > 1 ? [radiusOf(shot.points)] : [])))
  return shots.map((shot, index) => {
    if (!shot) return narrow ? HERO_NARROW : HERO_WIDE
    if (!shot.points.length) return FALLBACK
    return stickersPreset(shot.points, shot.normals, shot.points.length > 1 ? groupRadius : 0, index, narrow)
  })
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

// In the sticker editor (?edit): a click on the model puts the selected sticker there, and every
// change in the editor moves that sticker's decal at once.
function useStickerEditing(model: THREE.Object3D, mesh: THREE.Mesh | null, initial: Sticker[], decals: Map<string, THREE.Mesh>) {
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const current = useRef(initial)

  useEffect(() => {
    if (!EDITING || !mesh) return
    // Start close enough to see the stickers.
    const perspective = camera as THREE.PerspectiveCamera
    perspective.position.set(0, -0.8, 13)
    perspective.fov = 30
    perspective.updateProjectionMatrix()

    const unsubscribe = useEditor.subscribe((state) => {
      const next = layout(state.edits)
      next.forEach((sticker, i) => {
        const before = current.current[i]
        if (before && before.y === sticker.y && before.z === sticker.z && before.size === sticker.size && before.tilt === sticker.tilt) return
        const old = decals.get(sticker.id)
        // Decals are built in the model's own space, as on load: lift it out of the scene's
        // scale and turn for a moment.
        const parent = model.parent
        parent?.remove(model)
        model.updateMatrixWorld(true)
        const made = makeDecal(mesh, sticker, old?.material as THREE.MeshStandardMaterial | undefined)
        parent?.add(model)
        model.updateMatrixWorld(true)
        if (!made) return
        if (old) {
          old.removeFromParent()
          old.geometry.dispose()
        }
        model.add(made.decal)
        decals.set(sticker.id, made.decal)
      })
      current.current = next
    })

    // A click (not a drag, which turns the model) on the model places the selected sticker.
    const raycaster = new THREE.Raycaster()
    let down: { x: number; y: number } | null = null
    const onDown = (event: PointerEvent) => {
      down = { x: event.clientX, y: event.clientY }
    }
    const onUp = (event: PointerEvent) => {
      if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) return
      down = null
      const { selected, update } = useEditor.getState()
      if (!selected) return
      const rect = gl.domElement.getBoundingClientRect()
      const ndc = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      const hit = raycaster.intersectObject(mesh, false)[0]
      if (!hit) return
      const local = model.worldToLocal(hit.point.clone())
      const base = current.current.find((sticker) => sticker.id === selected)
      if (!base) return
      update(selected, { y: local.y, z: local.z }, { y: base.y, z: base.z, size: base.size, tilt: base.tilt })
    }
    gl.domElement.addEventListener('pointerdown', onDown)
    gl.domElement.addEventListener('pointerup', onUp)
    return () => {
      unsubscribe()
      gl.domElement.removeEventListener('pointerdown', onDown)
      gl.domElement.removeEventListener('pointerup', onUp)
    }
  }, [gl, camera, model, mesh, decals])
}

function StaticCharacter({ focusRef, frameRef }: { focusRef: MutableRefObject<THREE.Vector3>; frameRef: MutableRefObject<number> }) {
  const { scene } = useGLTF(useModelUrl())
  const { model, offset, scale, wide, narrow, eyes, mesh, stickers, decals } = useMemo(() => {
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
    const stickers = layout(EDITING ? useEditor.getState().edits : {})
    const { anchors, decals } = mesh ? applyStickers(clone, mesh, stickers) : { anchors: [], decals: new Map<string, THREE.Mesh>() }
    const eyes = mesh ? createPaintedEyes(mesh) : []
    return {
      model: clone,
      offset,
      scale,
      eyes,
      mesh,
      stickers,
      decals,
      wide: buildPresets(anchors, offset, scale, false),
      narrow: buildPresets(anchors, offset, scale, true),
    }
  }, [scene])

  useStickerEditing(model, mesh, stickers, decals)

  // Keep the loading screen up until the GPU is really ready. three.js otherwise compiles shaders and
  // uploads textures lazily, and on a real GPU the driver finishes that work in the background: the
  // first frames return at once but the model only shows up a moment later, after the loader is gone.
  // So upload every texture, wait for every shader to compile, then for frames to arrive at a steady
  // rate again (the browser holds frames back while the GPU is busy).
  const warmUp = useRef({ started: 0, compiled: false, steady: 0, done: false })
  useFrame((state, delta) => {
    const w = warmUp.current
    if (w.done) return
    if (!w.started) {
      w.started = performance.now()
      state.scene.traverse((object) => {
        const materials = (object as THREE.Mesh).material
        if (!materials) return
        for (const material of Array.isArray(materials) ? materials : [materials]) {
          for (const value of Object.values(material)) {
            if ((value as THREE.Texture | null)?.isTexture) state.gl.initTexture(value as THREE.Texture)
          }
        }
      })
      const compiled = () => {
        w.compiled = true
      }
      state.gl.compileAsync(state.scene, state.camera).then(compiled, compiled)
      return
    }
    w.steady = w.compiled && delta < 0.05 ? w.steady + 1 : 0
    // Slow machines may never reach a steady 20 fps: give up waiting after a few seconds.
    if (w.steady >= 5 || performance.now() - w.started > 6000) {
      w.done = true
      boot.finish()
    }
  })

  const get = useThree((state) => state.get)
  const desiredPosition = useRef(new THREE.Vector3())
  const desiredTarget = useRef(new THREE.Vector3())
  // The flight to the current step: where it started and when.
  const flight = useRef({ step: -1, start: 0, fromPosition: new THREE.Vector3(), fromTarget: new THREE.Vector3(), fromFov: 30 })

  useFrame((state, delta) => {
    // The editor moves the camera with orbit controls instead.
    if (EDITING) return
    const camera = get().camera as THREE.PerspectiveCamera
    const presets = camera.aspect < 0.85 ? narrow : wide
    const step = useTour.getState().step
    const to = presets[step]
    const f = flight.current
    const t = state.clock.elapsedTime

    if (f.step === -1) {
      // First frame: start on the current step instead of flying in behind the loading screen.
      camera.position.fromArray(to.position)
      focusRef.current.fromArray(to.target)
      camera.fov = to.fov
      f.step = step
      f.start = t - FLIGHT
    } else if (f.step !== step) {
      f.step = step
      f.start = t
      f.fromPosition.copy(camera.position)
      f.fromTarget.copy(focusRef.current)
      f.fromFov = camera.fov
    }

    const progress = THREE.MathUtils.clamp((t - f.start) / FLIGHT, 0, 1)
    desiredPosition.current.fromArray(to.position)
    desiredTarget.current.fromArray(to.target)
    if (progress < 1) {
      const e = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
      const pullBack = Math.sin(Math.PI * e) * f.fromPosition.distanceTo(desiredPosition.current) * 0.3
      camera.position.lerpVectors(f.fromPosition, desiredPosition.current, e).z += pullBack
      focusRef.current.lerpVectors(f.fromTarget, desiredTarget.current, e)
      camera.fov = THREE.MathUtils.lerp(f.fromFov, to.fov, e)
    } else {
      // Settled: keep easing toward the preset, which also absorbs window resizes smoothly.
      const smoothing = 1 - Math.pow(0.02, delta)
      camera.position.lerp(desiredPosition.current, smoothing)
      focusRef.current.lerp(desiredTarget.current, smoothing)
      camera.fov = THREE.MathUtils.lerp(camera.fov, to.fov, smoothing)
    }
    camera.lookAt(focusRef.current)
    camera.updateProjectionMatrix()
    frameRef.current = step
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

    // Full head-follow on the wide shots; calmer during sticker close-ups.
    const k = 1 - Math.pow(0.02, delta)
    // Still while editing, so clicks land where the stickers are.
    const amp = EDITING ? 0 : typeof TOUR[frameRef.current]?.camera === 'string' ? 1 : 0.12
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
      {EDITING ? <OrbitControls makeDefault target={[0, -1.2, 1]} minDistance={2} maxDistance={30} /> : <Post focusRef={focusRef} lowPower={lowPower} />}
    </>
  )
}
