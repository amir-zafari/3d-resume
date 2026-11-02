import * as THREE from 'three'
import PLACEMENTS from '../data/stickerPlacements.json'
import { siAndroid, siElementor, siJavascript, siLaravel, siN8n, siOpenai, siPhp, siPython, siSelenium, siTelegram, siWordpress, type SimpleIcon } from 'simple-icons'

type Design =
  | { kind: 'icon'; icon: SimpleIcon; bg?: string }
  | { kind: 'text'; label: string; bg: string; fg: string; sub?: string }
  // A company logo from public/logos, fitted inside a rounded-square sticker.
  | { kind: 'logo'; src: string; bg: string }

// ---------------------------------------------------------------------------------------------
// Where stickers can go. Coordinates are in the model's own space (face looks down +x):
// y = height, z = sideways (+z is the viewer's LEFT).
// ---------------------------------------------------------------------------------------------
type ZoneName = 'companies' | 'skills' | 'leftCheek' | 'rightCheek'

// The jacket's zipper runs diagonally down the viewer's left side of the chest: z of the zipper
// at height y, measured from screenshots. Stickers keep clear of it, and of the seam down the
// middle (z = 0), so none gets crumpled.
const zipperZ = (y: number) => 0.153 - 0.552 * (y + 0.27)

// Scattered zones: stickers are spread over the area, evenly but not in rows. `fits` says whether
// a sticker of radius r centred at (y, z) lies inside.
type Scatter = { kind: 'scatter'; y: [number, number]; z: [number, number]; size: number; seed: number; fits: (y: number, z: number, r: number) => boolean }
// Grid zones: filled as a grid, in list order.
type Grid = { kind: 'grid'; y: [number, number]; z: [number, number]; cols: number; size: number }

const ZONES: Record<ZoneName, Scatter | Grid> = {
  // Viewer's left shoulder, between the arm and the zipper: logos of the companies and clients.
  companies: {
    kind: 'scatter', y: [-0.228, -0.432], z: [0.36, 0.14], size: 0.041, seed: 7,
    fits: (y, z, r) => z + r < 0.36 && z - r > zipperZ(y) + 0.012 && y + r < -0.228 && y - r > -0.432,
  },
  // Right of the zipper, across the chest to the other shoulder: skills, clear of the neck.
  skills: {
    kind: 'scatter', y: [-0.25, -0.432], z: [0.2, -0.36], size: 0.056, seed: 3,
    fits: (y, z, r) =>
      z - r > -0.36 && z + r < zipperZ(y) - 0.045 && Math.abs(z) > r + 0.03 && y + r < -0.25 && y - r > -0.432 && !(z - r < 0.13 && z + r > -0.11 && y + r > -0.3),
  },
  // Two stickers per cheek: one under the eye, one lower toward the jaw. Personal info lives here.
  leftCheek: { kind: 'grid', y: [0.078, 0.024], z: [0.1, 0.086], cols: 1, size: 0.054 },
  rightCheek: { kind: 'grid', y: [0.078, 0.024], z: [-0.1, -0.086], cols: 1, size: 0.054 },
}

interface StickerDef {
  // Name used by the sticker editor (?edit) and data/stickerPlacements.json.
  id: string
  zone: ZoneName
  design: Design
  // Id a tour step (data/tour.ts) uses to fly the camera to this sticker.
  focus?: number
  size?: number
}

const text = (label: string, bg: string, fg = '#ffffff', sub?: string): Design => ({ kind: 'text', label, bg, fg, sub })
const icon = (i: SimpleIcon, bg?: string): Design => ({ kind: 'icon', icon: i, bg })
const logo = (file: string, bg = '#ffffff'): Design => ({ kind: 'logo', src: `${import.meta.env.BASE_URL}logos/${file}`, bg })

// ---------------------------------------------------------------------------------------------
// The stickers. To change one: edit its label/colour/icon. To add: append a line with a zone.
// To move: change its zone. Order inside a zone = left-to-right, top-to-bottom placement.
// ---------------------------------------------------------------------------------------------
export const STICKER_LIST: StickerDef[] = [
  // درباره من — cheeks (camera visits these first, alternating left/right).
  { id: 'amir', zone: 'leftCheek', design: text('</> AMIR', '#111827', '#f5c518', 'WEB DEVELOPER'), focus: 0 },
  { id: 'contact', zone: 'rightCheek', design: text('CONTACT', '#26a5e4', '#ffffff', 'MAIL · TELEGRAM'), focus: 1 },
  { id: 'toos', zone: 'leftCheek', design: text('TOOS', '#1d3557', '#ffffff', 'UNIVERSITY'), focus: 3 },
  { id: 'mashhad', zone: 'rightCheek', design: text('MASHHAD', '#0f766e', '#ffffff', 'IRAN'), focus: 2 },

  // مهارت‌ها — spread over the jacket, right of the zipper.
  { id: 'php', zone: 'skills', design: icon(siPhp, '#ffffff'), focus: 4 },
  { id: 'laravel', zone: 'skills', design: icon(siLaravel), focus: 5 },
  { id: 'python', zone: 'skills', design: icon(siPython), focus: 6 },
  { id: 'n8n', zone: 'skills', design: icon(siN8n), focus: 7 },
  { id: 'selenium', zone: 'skills', design: icon(siSelenium), focus: 8 },
  { id: 'wordpress', zone: 'skills', design: icon(siWordpress), focus: 9 },
  { id: 'elementor', zone: 'skills', design: icon(siElementor), focus: 10 },
  { id: 'openai', zone: 'skills', design: icon(siOpenai, '#ffffff'), focus: 11 },
  { id: 'android', zone: 'skills', design: icon(siAndroid), focus: 12 },
  { id: 'javascript', zone: 'skills', design: icon(siJavascript, '#222222'), focus: 13 },
  { id: 'code', zone: 'skills', design: text('I ♥ CODE', '#ffffff', '#e11d48') },
  { id: 'telegram', zone: 'skills', design: icon(siTelegram) },

  // سوابق کاری — logos of the companies and clients I have worked for, on the left shoulder.
  { id: 'barcelon', zone: 'companies', design: logo('barcelon.png', '#111111'), focus: 14 },
  { id: 'arnik', zone: 'companies', design: logo('arnik.png'), focus: 15 },
  { id: 'vakilbashi', zone: 'companies', design: logo('vakilbashi.svg'), focus: 16 },
  { id: 'see5', zone: 'companies', design: logo('see5.png'), focus: 17 },
  { id: 'eight', zone: 'companies', design: logo('eight.svg'), focus: 18 },
  { id: 'artifex', zone: 'companies', design: logo('artifex.svg'), focus: 19 },
  { id: 'atari', zone: 'companies', design: logo('atari.png'), focus: 20 },
  { id: 'drkamandi', zone: 'companies', design: logo('drkamandi.png'), focus: 21 },
  { id: 'fruitord', zone: 'companies', design: logo('fruitord.png'), focus: 22 },
  { id: 'webello', zone: 'companies', design: logo('webello.png'), focus: 23 },
  { id: 'yazan', zone: 'companies', design: logo('yazan.png'), focus: 24 },
  { id: 'iran-gomrok', zone: 'companies', design: logo('iran-gomrok.png'), focus: 25 },
]

export interface Sticker {
  id: string
  design: Design
  y: number
  z: number
  size: number
  tilt: number
  focus?: number
}

// Small repeatable random numbers, so the layout is the same on every visit.
function random(seed: number) {
  let t = seed * 0x9e3779b9
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

// Spreads stickers over a zone: each goes to the candidate spot farthest from the ones already
// placed ("best candidate" sampling), which looks hand-placed but never piles them up.
function scatter(zone: Scatter, defs: StickerDef[]) {
  const rand = random(zone.seed)
  const placed: { y: number; z: number; r: number }[] = []
  return defs.map((def) => {
    // Half-diagonal of a rounded square, so tilted neighbours never touch.
    const r = ((def.size ?? zone.size) / 2) * 1.3
    let best = { y: (zone.y[0] + zone.y[1]) / 2, z: (zone.z[0] + zone.z[1]) / 2, score: -Infinity }
    for (let i = 0; i < 400; i++) {
      const y = THREE.MathUtils.lerp(zone.y[0], zone.y[1], rand())
      const z = THREE.MathUtils.lerp(zone.z[0], zone.z[1], rand())
      if (!zone.fits(y, z, r)) continue
      const gap = Math.min(Infinity, ...placed.map((p) => Math.hypot(p.y - y, p.z - z) - p.r - r))
      if (gap > best.score) best = { y, z, score: gap }
    }
    placed.push({ y: best.y, z: best.z, r })
    return { y: best.y, z: best.z, tilt: (rand() - 0.5) * 0.4 }
  })
}

function grid(zone: Grid, defs: StickerDef[]) {
  const rows = Math.max(1, Math.ceil(defs.length / zone.cols))
  return defs.map((_, i) => {
    const col = i % zone.cols
    const row = Math.floor(i / zone.cols)
    const ty = rows === 1 ? 0.5 : row / (rows - 1)
    const tz = zone.cols === 1 ? 0 : col / (zone.cols - 1)
    return { y: THREE.MathUtils.lerp(zone.y[0], zone.y[1], ty), z: THREE.MathUtils.lerp(zone.z[0], zone.z[1], tz), tilt: (i % 2 ? 1 : -1) * 0.08 }
  })
}

// A sticker's spot set by hand: model-space height and sideways position, plus optional size and
// rotation. Saved ones live in data/stickerPlacements.json (exported from the editor at ?edit).
export type Placement = { y: number; z: number; size?: number; tilt?: number }

export function layout(overrides: Record<string, Placement> = {}): Sticker[] {
  const byZone = new Map<ZoneName, StickerDef[]>()
  for (const def of STICKER_LIST) byZone.set(def.zone, [...(byZone.get(def.zone) ?? []), def])
  const out: Sticker[] = []
  for (const [name, defs] of byZone) {
    const zone = ZONES[name]
    const spots = zone.kind === 'scatter' ? scatter(zone, defs) : grid(zone, defs)
    defs.forEach((def, i) => {
      // A spot chosen by hand in the sticker editor wins over the automatic one.
      const placed = overrides[def.id] ?? (PLACEMENTS as Record<string, Placement>)[def.id]
      out.push({ id: def.id, design: def.design, focus: def.focus, size: def.size ?? zone.size, ...spots[i], ...placed })
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
export type { Design }

export function makeStickerTexture(design: Design): { texture: THREE.CanvasTexture; aspect: number } {
  const isText = design.kind === 'text'
  const isLogo = design.kind === 'logo'
  const W = 512
  const H = isText ? 300 : 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const pad = 14
  const shape = () => {
    if (isText) roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, (H - pad * 2) * 0.32)
    else if (isLogo) roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, W * 0.22)
    else { ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - pad, 0, Math.PI * 2) }
  }

  // Drawn again once a logo's image has loaded.
  const paint = (image?: HTMLImageElement) => {
    ctx.clearRect(0, 0, W, H)
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
    } else if (design.kind === 'logo') {
      ctx.fillStyle = design.bg
      ctx.fillRect(0, 0, W, H)
      if (image?.naturalWidth) {
        // Fit inside the sticker with a margin.
        const boxW = W * 0.8
        const boxH = H * 0.7
        const k = Math.min(boxW / image.naturalWidth, boxH / image.naturalHeight)
        const w = image.naturalWidth * k
        const h = image.naturalHeight * k
        ctx.drawImage(image, (W - w) / 2, (H - h) / 2, w, h)
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
  }
  paint()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  if (design.kind === 'logo') {
    const image = new Image()
    image.onload = () => {
      paint(image)
      texture.needsUpdate = true
    }
    image.src = design.src
  }
  return { texture, aspect: W / H }
}
