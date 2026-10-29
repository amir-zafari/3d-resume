import * as THREE from 'three'

// The model's eyes are painted into its texture. Each eye gets a thin overlay copied from the face
// triangles under it; its own small canvas repaints the opening (white, moving iris, eyelid for blinks)
// so the eye moves without any geometry poking through the lids.

// Texture-space boxes (px in the 2048 base map) and opening outlines traced at 5x inside each box.
const PATCHES = [
  {
    box: [1344, 1274, 158, 114],
    outline: [[212, 208], [250, 203], [300, 200], [350, 201], [400, 207], [445, 226], [480, 252], [503, 285], [512, 318], [506, 338], [480, 337], [440, 330], [395, 320], [350, 307], [305, 292], [265, 272], [235, 248], [218, 226]],
  },
  {
    box: [1427, 371, 127, 135],
    outline: [[400, 132], [412, 160], [418, 200], [420, 260], [415, 320], [405, 370], [392, 410], [378, 445], [365, 472], [347, 462], [325, 430], [307, 385], [300, 330], [305, 270], [322, 222], [348, 180], [378, 148]],
  },
] as const

const SCALE = 4
const TEX_SIZE = 2048
const FRONT_X = 0.18
const EYE_DEPTH_X = 0.222

export interface PaintedEye {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  texture: THREE.CanvasTexture
  original: HTMLCanvasElement
  outline: Path2D
  // Maps model-space (z, y) on the eye to canvas pixels: [a, b, c, d, e, f] for ctx.setTransform.
  transform: [number, number, number, number, number, number]
  center: THREE.Vector3
  irisRadius: number
  travel: { z: number; y: number }
  top: number
  height: number
  skin: string
}

function irisCanvas() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const c = size / 2
  const base = ctx.createRadialGradient(c, c, size * 0.06, c, c, c)
  base.addColorStop(0, '#7a4b2a')
  base.addColorStop(0.5, '#55321b')
  base.addColorStop(0.86, '#331d0f')
  base.addColorStop(0.97, '#140a05')
  base.addColorStop(1, 'rgba(20,10,5,0)')
  ctx.fillStyle = base
  ctx.beginPath()
  ctx.arc(c, c, c, 0, Math.PI * 2)
  ctx.fill()
  for (let i = 0; i < 180; i += 1) {
    const a = (i / 180) * Math.PI * 2 + Math.random() * 0.03
    ctx.strokeStyle = `rgba(${150 + Math.random() * 60}, ${95 + Math.random() * 40}, 50, ${0.1 + Math.random() * 0.18})`
    ctx.lineWidth = 1 + Math.random() * 1.5
    ctx.beginPath()
    ctx.moveTo(c + Math.cos(a) * size * 0.14, c + Math.sin(a) * size * 0.14)
    ctx.lineTo(c + Math.cos(a) * size * (0.34 + Math.random() * 0.1), c + Math.sin(a) * size * (0.34 + Math.random() * 0.1))
    ctx.stroke()
  }
  ctx.fillStyle = '#060302'
  ctx.beginPath()
  ctx.arc(c, c, size * 0.15, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

const IRIS = typeof document !== 'undefined' ? irisCanvas() : null

// Least-squares fit of canvas = M · (z, y, 1) from the mesh vertices that land inside the patch.
function fitTransform(samples: { z: number; y: number; px: number; py: number }[]) {
  const ata = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  const atx = [0, 0, 0]
  const aty = [0, 0, 0]
  for (const s of samples) {
    const row = [s.z, s.y, 1]
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) ata[i * 3 + j] += row[i] * row[j]
      atx[i] += row[i] * s.px
      aty[i] += row[i] * s.py
    }
  }
  const m = new THREE.Matrix3().fromArray(ata).transpose().invert()
  const solve = (b: number[]) => new THREE.Vector3(...b).applyMatrix3(m)
  const x = solve(atx)
  const y = solve(aty)
  // setTransform(a, b, c, d, e, f): X = a·z + c·y + e, Y = b·z + d·y + f
  return [x.x, y.x, x.y, y.y, x.z, y.z] as [number, number, number, number, number, number]
}

// Both eyes share one iris size and one travel range, so they read as a matched pair.
export function createPaintedEyes(mesh: THREE.Mesh): PaintedEye[] {
  const eyes = buildEyes(mesh)
  if (eyes.length < 2) return eyes
  const radius = eyes.reduce((s, e) => s + e.irisRadius, 0) / eyes.length
  const travelZ = Math.min(...eyes.map((e) => e.travel.z))
  const travelY = Math.min(...eyes.map((e) => e.travel.y))
  // One eye's inner corner sits on a separate texture island, which pushes its traced centre outward;
  // mirroring the two centres keeps the irises level and equally spaced from the nose.
  const halfGap = eyes.reduce((s, e) => s + Math.abs(e.center.z), 0) / eyes.length
  const level = eyes.reduce((s, e) => s + e.center.y, 0) / eyes.length
  for (const eye of eyes) {
    eye.irisRadius = radius
    eye.travel = { z: travelZ, y: travelY }
    eye.center.set(eye.center.x, level, Math.sign(eye.center.z) * halfGap)
  }
  return eyes
}

function buildEyes(mesh: THREE.Mesh): PaintedEye[] {
  const material = mesh.material as THREE.MeshStandardMaterial
  const image = material.map?.image as CanvasImageSource | undefined
  if (!image) return []
  const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  const normal = geometry.attributes.normal

  return PATCHES.map(({ box, outline }) => {
    const [bx, by, bw, bh] = box
    const inBox = (i: number) => {
      const px = uv.getX(i) * TEX_SIZE - bx
      const py = uv.getY(i) * TEX_SIZE - by
      return px >= 0 && py >= 0 && px <= bw && py <= bh && pos.getX(i) > FRONT_X
    }

    const samples: { z: number; y: number; px: number; py: number }[] = []
    const positions: number[] = []
    const normals: number[] = []
    const uv0: number[] = []
    const uv1: number[] = []
    for (let t = 0; t < pos.count; t += 3) {
      if (!inBox(t) || !inBox(t + 1) || !inBox(t + 2)) continue
      for (let k = 0; k < 3; k += 1) {
        const i = t + k
        const u = uv.getX(i)
        const v = uv.getY(i)
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
        normals.push(normal.getX(i), normal.getY(i), normal.getZ(i))
        uv0.push(u, v)
        uv1.push((u * TEX_SIZE - bx) / bw, (v * TEX_SIZE - by) / bh)
        samples.push({ z: pos.getZ(i), y: pos.getY(i), px: (u * TEX_SIZE - bx) * SCALE, py: (v * TEX_SIZE - by) * SCALE })
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = bw * SCALE
    canvas.height = bh * SCALE
    const ctx = canvas.getContext('2d')!
    const original = document.createElement('canvas')
    original.width = canvas.width
    original.height = canvas.height
    const octx = original.getContext('2d')!
    octx.imageSmoothingQuality = 'high'
    octx.drawImage(image, bx, by, bw, bh, 0, 0, canvas.width, canvas.height)

    const path = new Path2D()
    outline.forEach(([x, y], i) => (i ? path.lineTo((x / 5) * SCALE, (y / 5) * SCALE) : path.moveTo((x / 5) * SCALE, (y / 5) * SCALE)))
    path.closePath()

    const transform = fitTransform(samples)
    // Invert the fit to find the opening's extent in model space.
    const inv = new THREE.Matrix3().set(transform[0], transform[2], transform[4], transform[1], transform[3], transform[5], 0, 0, 1).invert()
    const corners = outline.map(([x, y]) => new THREE.Vector3((x / 5) * SCALE, (y / 5) * SCALE, 1).applyMatrix3(inv))
    const zs = corners.map((c) => c.x)
    const ys = corners.map((c) => c.y)
    const zMin = Math.min(...zs)
    const zMax = Math.max(...zs)
    const yMin = Math.min(...ys)
    const yMax = Math.max(...ys)
    const height = yMax - yMin
    const width = zMax - zMin
    const irisRadius = height * 0.72

    // Skin tone for the blinking lid, sampled just above the opening.
    const top = corners.reduce((a, c) => (c.y > a.y ? c : a))
    const above = new THREE.Vector3(top.x, top.y + height * 0.6, 1)
    const sx = transform[0] * above.x + transform[2] * above.y + transform[4]
    const sy = transform[1] * above.x + transform[3] * above.y + transform[5]
    const px = octx.getImageData(THREE.MathUtils.clamp(Math.round(sx), 0, canvas.width - 1), THREE.MathUtils.clamp(Math.round(sy), 0, canvas.height - 1), 1, 1).data
    const skin = `rgb(${px[0]}, ${px[1]}, ${px[2]})`

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = false
    texture.channel = 1
    texture.anisotropy = 4

    const overlayGeometry = new THREE.BufferGeometry()
    overlayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    overlayGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    overlayGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv0, 2))
    overlayGeometry.setAttribute('uv1', new THREE.Float32BufferAttribute(uv1, 2))
    const overlayMaterial = material.clone()
    overlayMaterial.map = texture
    // A wet-looking eye still shouldn't mirror the lights: keep the opening slightly matte.
    overlayMaterial.roughnessMap = null
    overlayMaterial.roughness = 0.55
    overlayMaterial.metalnessMap = null
    overlayMaterial.metalness = 0
    overlayMaterial.transparent = true
    overlayMaterial.depthWrite = false
    overlayMaterial.polygonOffset = true
    overlayMaterial.polygonOffsetFactor = -2
    overlayMaterial.polygonOffsetUnits = -2
    const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
    overlay.renderOrder = 1
    overlay.receiveShadow = true
    mesh.add(overlay)

    return {
      canvas,
      ctx,
      texture,
      original,
      outline: path,
      transform,
      center: new THREE.Vector3(EYE_DEPTH_X, (yMin + yMax) / 2, (zMin + zMax) / 2),
      irisRadius,
      travel: { z: Math.max(0, width / 2 - irisRadius * 0.75), y: height * 0.45 },
      top: yMax,
      height,
      skin,
    }
  })
}

// gaze: direction in model space; blink: 0 open → 1 closed.
export function paintEye(eye: PaintedEye, gaze: THREE.Vector3, blink: number) {
  const { ctx, transform: m, center, irisRadius: r } = eye
  // Only the opening is painted; everything else stays transparent so the face shows through untouched.
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.save()
  ctx.clip(eye.outline)

  ctx.setTransform(...m)
  const span = Math.max(eye.height * 2, r * 3)
  const sclera = ctx.createRadialGradient(center.z, center.y, 0, center.z, center.y, span)
  sclera.addColorStop(0, '#dcd1c7')
  sclera.addColorStop(0.4, '#c7b8ad')
  sclera.addColorStop(1, '#8f7b70')
  ctx.fillStyle = sclera
  ctx.fillRect(center.z - span, center.y - span, span * 2, span * 2)

  const dir = gaze.clone().normalize()
  const iz = center.z + THREE.MathUtils.clamp(Math.atan2(dir.z, dir.x) * r * 1.6, -eye.travel.z, eye.travel.z)
  const iy = center.y + THREE.MathUtils.clamp(Math.atan2(dir.y, dir.x) * r * 1.8, -eye.travel.y, eye.travel.y)
  if (IRIS) ctx.drawImage(IRIS, iz - r, iy - r, r * 2, r * 2)
  // Real upper lids follow a downward glance a little.
  blink = Math.max(blink, THREE.MathUtils.clamp(-Math.atan2(dir.y, dir.x) * 0.7, 0, 0.28))
  // Catch-light, fixed relative to the key light (up and to the side).
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.beginPath()
  ctx.ellipse(iz + r * 0.32, iy + r * 0.36, r * 0.16, r * 0.13, 0, 0, Math.PI * 2)
  ctx.fill()

  // Shadow cast by the upper lid and lashes.
  const shadow = ctx.createLinearGradient(0, eye.top, 0, eye.top - eye.height * 0.55)
  shadow.addColorStop(0, 'rgba(35, 18, 10, 0.8)')
  shadow.addColorStop(1, 'rgba(35, 18, 10, 0)')
  ctx.fillStyle = shadow
  ctx.fillRect(center.z - span, eye.top - eye.height, span * 2, eye.height * 1.5)

  if (blink > 0.001) {
    const edge = eye.top + eye.height * 0.15 - blink * eye.height * 1.3
    ctx.fillStyle = eye.skin
    ctx.fillRect(center.z - span, edge, span * 2, span)
    ctx.fillStyle = 'rgba(30, 15, 8, 0.85)'
    ctx.fillRect(center.z - span, edge - eye.height * 0.05, span * 2, eye.height * 0.1)
  }
  ctx.restore()

  // Soft inner edge so the repainted opening blends into the lids.
  ctx.save()
  ctx.clip(eye.outline)
  ctx.strokeStyle = 'rgba(70, 38, 24, 0.4)'
  ctx.lineWidth = SCALE * 1.3
  ctx.filter = `blur(${SCALE * 0.6}px)`
  ctx.stroke(eye.outline)
  ctx.restore()

  eye.texture.needsUpdate = true
}
