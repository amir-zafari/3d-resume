import * as THREE from 'three'
import { siAndroid, siElementor, siJavascript, siLaravel, siN8n, siOpenai, siPhp, siPython, siSelenium, siTelegram, siWordpress, type SimpleIcon } from 'simple-icons'

type Design =
  | { kind: 'icon'; icon: SimpleIcon; bg?: string }
  | { kind: 'text'; label: string; bg: string; fg: string; sub?: string }

// ---------------------------------------------------------------------------------------------
// Where stickers can go. Coordinates are in the model's own space (face looks down +x):
// y = height, z = sideways (+z is the viewer's LEFT). Each zone is filled as a grid, in list order.
// ---------------------------------------------------------------------------------------------
type ZoneName = 'workShoulder' | 'toolShoulder' | 'chest' | 'leftCheek' | 'rightCheek'

const ZONES: Record<ZoneName, { y: [number, number]; z: [number, number]; cols: number; size: number }> = {
  // Viewer's left shoulder: work experience and companies.
  workShoulder: { y: [-0.255, -0.4], z: [0.315, 0.165], cols: 3, size: 0.066 },
  // Viewer's right shoulder: skills (visited right after the cheeks).
  toolShoulder: { y: [-0.26, -0.39], z: [-0.165, -0.315], cols: 3, size: 0.06 },
  // Front of the jacket: the rest of the skills.
  chest: { y: [-0.315, -0.425], z: [0.11, -0.11], cols: 3, size: 0.058 },
  // Two stickers per cheek: one under the eye, one lower toward the jaw. Personal info lives here.
  leftCheek: { y: [0.078, 0.024], z: [0.1, 0.086], cols: 1, size: 0.054 },
  rightCheek: { y: [0.078, 0.024], z: [-0.1, -0.086], cols: 1, size: 0.054 },
}

interface StickerDef {
  zone: ZoneName
  design: Design
  // Index of the résumé entry (ui/Resume.tsx) whose close-up flies to this sticker.
  focus?: number
  size?: number
}

const text = (label: string, bg: string, fg = '#ffffff', sub?: string): Design => ({ kind: 'text', label, bg, fg, sub })
const icon = (i: SimpleIcon, bg?: string): Design => ({ kind: 'icon', icon: i, bg })

// ---------------------------------------------------------------------------------------------
// The stickers. To change one: edit its label/colour/icon. To add: append a line with a zone.
// To move: change its zone. Order inside a zone = left-to-right, top-to-bottom placement.
// ---------------------------------------------------------------------------------------------
const STICKER_LIST: StickerDef[] = [
  // درباره من — cheeks (camera visits these first, alternating left/right).
  { zone: 'leftCheek', design: text('</> AMIR', '#111827', '#f5c518', 'WEB DEVELOPER'), focus: 0 },
  { zone: 'rightCheek', design: text('CONTACT', '#26a5e4', '#ffffff', 'MAIL · TELEGRAM'), focus: 1 },
  { zone: 'leftCheek', design: text('MASHHAD', '#0f766e', '#ffffff', 'IRAN'), focus: 2 },
  { zone: 'rightCheek', design: text('TOOS', '#1d3557', '#ffffff', 'UNIVERSITY'), focus: 3 },

  // مهارت‌ها — tools shoulder, then the jacket front, in résumé order.
  { zone: 'toolShoulder', design: icon(siPhp, '#ffffff'), focus: 4 },
  { zone: 'toolShoulder', design: icon(siLaravel), focus: 5 },
  { zone: 'toolShoulder', design: icon(siPython), focus: 6 },
  { zone: 'toolShoulder', design: icon(siN8n), focus: 7 },
  { zone: 'toolShoulder', design: icon(siSelenium), focus: 8 },
  { zone: 'toolShoulder', design: icon(siWordpress), focus: 9 },
  { zone: 'chest', design: icon(siElementor), focus: 10 },
  { zone: 'chest', design: icon(siOpenai, '#ffffff'), focus: 11 },
  { zone: 'chest', design: icon(siAndroid), focus: 12 },
  { zone: 'chest', design: icon(siJavascript, '#222222'), focus: 13 },
  { zone: 'chest', design: text('I ♥ CODE', '#ffffff', '#e11d48') },
  { zone: 'chest', design: icon(siTelegram) },

  // سوابق کاری — work shoulder.
  { zone: 'workShoulder', design: text('BARCELON', '#111111', '#f5c518'), focus: 14 },
  { zone: 'workShoulder', design: text('BASIR', '#14532d', '#ffffff', 'SHOP'), focus: 15 },
  { zone: 'workShoulder', design: text('ARNIK', '#0f766e', '#ffffff', 'WEB'), focus: 16 },
  { zone: 'workShoulder', design: text('AI BOT', '#26a5e4', '#ffffff', 'TELEGRAM'), focus: 17 },
  { zone: 'workShoulder', design: text('FRUITORD', '#ea580c', '#ffffff', 'STARTUP'), focus: 18 },
  { zone: 'workShoulder', design: text('BIME', '#b91c1c', '#ffffff', 'INSURANCE'), focus: 19 },
  { zone: 'workShoulder', design: text('NOAVAR', '#7b2cbf', '#ffffff', 'EIGHT'), focus: 20 },
]

export interface Sticker {
  design: Design
  y: number
  z: number
  size: number
  tilt: number
  focus?: number
}

// Small, repeatable "hand-placed" jitter so the grid doesn't look mechanical.
const wobble = (i: number, salt: number) => (((i * 9301 + salt * 49297) % 233280) / 233280 - 0.5)

function layout(): Sticker[] {
  const byZone = new Map<ZoneName, StickerDef[]>()
  for (const def of STICKER_LIST) byZone.set(def.zone, [...(byZone.get(def.zone) ?? []), def])
  const out: Sticker[] = []
  let n = 0
  for (const [name, defs] of byZone) {
    const zone = ZONES[name]
    const rows = Math.max(1, Math.ceil(defs.length / zone.cols))
    defs.forEach((def, i) => {
      const col = i % zone.cols
      const row = Math.floor(i / zone.cols)
      const inRow = Math.min(zone.cols, defs.length - row * zone.cols)
      const tz = inRow === 1 ? 0.5 : (col + (zone.cols - inRow) / 2) / Math.max(1, zone.cols - 1)
      const ty = rows === 1 ? 0.5 : row / (rows - 1)
      const cellZ = Math.abs(zone.z[1] - zone.z[0]) / Math.max(1, zone.cols)
      out.push({
        design: def.design,
        focus: def.focus,
        size: def.size ?? zone.size,
        y: THREE.MathUtils.lerp(zone.y[0], zone.y[1], ty) + wobble(n, 1) * 0.012,
        z: THREE.MathUtils.lerp(zone.z[0], zone.z[1], THREE.MathUtils.clamp(tz, 0, 1)) + wobble(n, 2) * cellZ * 0.25,
        tilt: wobble(n, 3) * 0.6,
      })
      n += 1
    })
  }
  return out
}

export const STICKERS: Sticker[] = layout()

const OUTLINE = 26

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Draws a die-cut vinyl sticker: thick white border, soft shadow, colored face.
export function makeStickerTexture(design: Design): { texture: THREE.CanvasTexture; aspect: number } {
  const isText = design.kind === 'text'
  const W = 512
  const H = isText ? 300 : 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const pad = 14
  const shape = () => {
    if (isText) roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, (H - pad * 2) * 0.32)
    else { ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - pad, 0, Math.PI * 2) }
  }

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 3
  shape()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(OUTLINE, OUTLINE)
  ctx.scale((W - OUTLINE * 2) / W, (H - OUTLINE * 2) / H)
  shape()
  ctx.clip()
  if (design.kind === 'text') {
    ctx.fillStyle = design.bg
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = design.fg
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const main = design.sub ? H * 0.42 : H * 0.5
    let size = 150
    ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`
    while (ctx.measureText(design.label).width > W * 0.8 && size > 40) {
      size -= 6
      ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`
    }
    ctx.fillText(design.label, W / 2, main)
    if (design.sub) {
      ctx.globalAlpha = 0.85
      ctx.font = `700 ${Math.round(size * 0.32)}px "Helvetica Neue", Arial, sans-serif`
      ctx.fillText(design.sub.split('').join(' '), W / 2, H * 0.73)
    }
  } else {
    const color = `#${design.icon.hex}`
    ctx.fillStyle = design.bg ?? color
    ctx.fillRect(0, 0, W, H)
    const path = new Path2D(design.icon.path)
    const s = (W * 0.56) / 24
    ctx.translate(W / 2 - 12 * s, H / 2 - 12 * s)
    ctx.scale(s, s)
    ctx.fillStyle = design.bg ? color : '#ffffff'
    ctx.fill(path)
  }
  ctx.restore()

  // Glossy highlight across the top of the vinyl.
  const gloss = ctx.createLinearGradient(0, 0, 0, H)
  gloss.addColorStop(0, 'rgba(255,255,255,0.28)')
  gloss.addColorStop(0.45, 'rgba(255,255,255,0)')
  ctx.save()
  shape()
  ctx.clip()
  ctx.fillStyle = gloss
  ctx.fillRect(0, 0, W, H)
  ctx.restore()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return { texture, aspect: W / H }
}
