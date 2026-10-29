import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { MotionConfig, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import * as THREE from 'three'
import Scene from './scene/Scene'
import NoiseOverlay from './ui/NoiseOverlay'
import Resume from './ui/Resume'
import Works from './ui/Works'
import LoadingScreen from './ui/LoadingScreen'
import { ResumePreview } from './ui/ResumePreview'
import Intro from './ui/Intro'
import Everyday from './ui/Everyday'
import { useStore } from './store'

function Backdrop() {
  // 点击空白处收起详情
  const setActive = useStore((s) => s.setActive)
  return (
    <mesh position={[0, 0, -40]} onClick={() => setActive(null)}>
      <planeGeometry args={[600, 300]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

// The model's reveal: no text, just a cue to keep scrolling into the résumé.
function Hero({ cueOpacity }: { cueOpacity: MotionValue<number> }) {
  return (
    <section className="hero">
      <motion.div className="scroll-cue" style={{ opacity: cueOpacity }} aria-hidden="true">
        <span className="scroll-cue-label">ادامه بده</span>
        <span className="scroll-cue-track">
          <span className="scroll-cue-dot" />
        </span>
      </motion.div>
    </section>
  )
}

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
  const { scrollY } = useScroll()
  // 作品区蒙层：以作品区顶部从视口底进入到视口中部的进度，驱动 3D 渐暗 + 模糊
  const worksRef = useRef(null)
  const { scrollYProgress: worksProgress } = useScroll({
    target: worksRef,
    offset: ['start end', 'start center'],
  })
  const fogBg = useTransform(
    worksProgress,
    [0, 1],
    ['rgba(7, 14, 27, 0)', 'rgba(7, 14, 27, 0.52)']
  )
  // Everything below is timed from the model reveal, which starts one screen down (after the intro).
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const scrimOpacity = useTransform(scrollY, [vh, vh + 520], [0, 0.4])
  const cueOpacity = useTransform(scrollY, [vh * 0.7, vh, vh + 160], [0, 1, 0])
  const heroGradientOpacity = useTransform(scrollY, [vh * 0.6, vh, vh + 240], [0, 1, 0])
  const railOpacity = useTransform(scrollY, [vh * 1.5, vh * 2.1], [0, 1])
  const heroChromeOpacity = useTransform(scrollY, [vh * 0.6, vh, vh + 280], [0, 1, 0])

  return (
    <MotionConfig reducedMotion="user">
      {/* 加载遮罩：模型全部加载完成前覆盖全屏，完成后淡出 */}
      <LoadingScreen />

      {/* 固定的 3D 背景 */}
      <div className="scene-bg">
        <Canvas
          shadows={lowPowerRendering ? false : { type: THREE.PCFShadowMap }}
          dpr={lowPowerRendering ? 1 : [1, 1.5]}
          camera={{ position: [0, 5, 19], fov: 39, near: 0.1, far: 500 }}
          gl={{ antialias: false, stencil: false, depth: true, powerPreference: lowPowerRendering ? 'low-power' : 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
          fallback={<WebGLFallback />}
        >
          <color attach="background" args={['#97ab8c']} />
          <Suspense fallback={null}>
            <Backdrop />
            <Scene lowPower={lowPowerRendering} />
          </Suspense>
        </Canvas>
      </div>

      {/* Soft screen-space reflections add sheen without adding 3D geometry. */}
      <div className="scene-gloss" aria-hidden="true" />

      {/* 滚动渐暗蒙层 */}
      <motion.div className="scrim" style={{ opacity: scrimOpacity }} aria-hidden="true" />

      {/* 作品区固定蒙层：仅压暗，避免滚动时昂贵的全屏背景模糊。 */}
      <motion.div
        className="stage-fog"
        style={{ background: fogBg /* , backdropFilter: fogBlur, WebkitBackdropFilter: fogBlur */ }}
        aria-hidden="true"
      />

      {/* 固定磨砂右轨（进入履历区淡入） */}
      <motion.div className="glass-rail" style={{ opacity: railOpacity }} aria-hidden="true" />

      {/* 首屏底部渐变底色，滚动后淡出 */}
      <motion.div
        className="hero-gradient"
        style={{ opacity: heroGradientOpacity }}
        aria-hidden="true"
      />

      {/* 首屏装饰：发丝内框 + 四角定位标 + 角标元数据（随滚动淡出） */}
      <motion.div className="hero-chrome" style={{ opacity: heroChromeOpacity }} aria-hidden="true">
        <div className="hero-frame" />
        <span className="hero-mark tl">+</span>
        <span className="hero-mark tr">+</span>
        <span className="hero-mark bl">+</span>
        <span className="hero-mark br">+</span>
        <div className="hero-meta hm-tl">
          <span className="hm-name">امیر حسین ظفری</span>
          <span>وب · لاراول · هوش مصنوعی</span>
        </div>
        <div className="hero-meta hm-tr">نمونه‌کار — ۱۴۰۵</div>
        <div className="hero-meta hm-bl">وردپرس · لاراول · اتوماسیون</div>
        <div className="hero-meta hm-right">آماده همکاری</div>
      </motion.div>

      {/* 全屏胶片噪点蒙层（multiply 混合） */}
      {!lowPowerRendering && <NoiseOverlay />}

      {/* 可滚动内容 */}
      <main className="content">
        <Intro onPreview={() => setPreviewOpen(true)} />
        <Hero cueOpacity={cueOpacity} />
        <Resume />
        <Works innerRef={worksRef} />
        <Everyday />
      </main>
      <ResumePreview open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </MotionConfig>
  )
}
