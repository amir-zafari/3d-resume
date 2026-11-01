import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { MotionConfig, useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import Scene from './scene/Scene'
import NoiseOverlay from './ui/NoiseOverlay'
import { ResumePreview } from './ui/ResumePreview'
import Tour from './ui/Tour'

function WebGLFallback() {
  return (
    <div className="webgl-fallback" role="status">
      پیش‌نمایش سه‌بعدی در دسترس نیست؛ محتوای صفحه همچنان قابل مشاهده است.
    </div>
  )
}

function useCompactRendering() {
  const query = '(max-width: 640px), (pointer: coarse)'
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setCompact(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return compact
}

export default function App() {
  const [previewOpen, setPreviewOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion() ?? false
  const compactRendering = useCompactRendering()
  const lowPowerRendering = compactRendering || prefersReducedMotion

  return (
    <MotionConfig reducedMotion="user">
      {/* 固定的 3D 背景 */}
      <div className="scene-bg">
        <Canvas
          shadows={lowPowerRendering ? false : { type: THREE.PCFShadowMap }}
          dpr={lowPowerRendering ? 1 : [1, 1.5]}
          camera={{ position: [0, 5, 19], fov: 39, near: 0.1, far: 500 }}
          gl={{ antialias: false, stencil: false, depth: true, powerPreference: lowPowerRendering ? 'low-power' : 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
          fallback={<WebGLFallback />}
          // The canvas never moves (the page doesn't scroll): skip re-measuring on scroll events.
          resize={{ scroll: false }}
        >
          <color attach="background" args={['#97ab8c']} />
          <Suspense fallback={null}>
            <Scene lowPower={lowPowerRendering} />
          </Suspense>
        </Canvas>
      </div>

      {/* Soft screen-space reflections add sheen without adding 3D geometry. */}
      <div className="scene-gloss" aria-hidden="true" />

      {/* Thin frame, corner marks and the name in the top corner. */}
      <div className="hero-chrome" aria-hidden="true">
        <div className="hero-frame" />
        <span className="hero-mark tl">+</span>
        <span className="hero-mark tr">+</span>
        <span className="hero-mark bl">+</span>
        <span className="hero-mark br">+</span>
        <div className="hero-meta hm-tl">
          <span className="hm-name">امیر حسین ظفری</span>
          <span>سایت · فروشگاه اینترنتی · اپ اندروید</span>
        </div>
      </div>
      <button className="resume-preview-trigger" type="button" onClick={() => setPreviewOpen(true)}>
        رزومه کامل
      </button>

      {/* 全屏胶片噪点蒙层（multiply 混合） */}
      {!lowPowerRendering && <NoiseOverlay />}

      <Tour onFullResume={() => setPreviewOpen(true)} />
      <ResumePreview open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </MotionConfig>
  )
}
