import { motion } from 'framer-motion'
import { CONTACT } from '../data/resume'

const EASE = [0.22, 1, 0.36, 1] as const
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }
const rise = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } } }

const FACTS = ['مهندس نرم‌افزار', 'مشهد، ایران', 'فعال از ۱۳۹۵', '+۳۰ نمونه‌کار']

// Opening screen: an opaque cover in the same style as the closing section, so the 3D model is
// revealed only once the visitor starts scrolling.
export default function Intro({ onPreview }: { onPreview: () => void }) {
  const scrollToModel = () => document.querySelector('.hero')?.scrollIntoView({ behavior: 'smooth' })
  return (
    <section className="intro" lang="fa" aria-labelledby="intro-title">
      <div className="everyday-glow" aria-hidden="true" />
      <motion.div className="intro-inner" variants={stagger} initial="hidden" animate="show">
        <motion.p className="intro-eyebrow" variants={rise}>رزومه</motion.p>
        <motion.h1 id="intro-title" variants={rise}>
          امیر حسین <em>ظفری</em>
        </motion.h1>
        <motion.p className="intro-role" variants={rise}>توسعه‌دهنده وب · وردپرس · لاراول · اتوماسیون و هوش مصنوعی</motion.p>
        <motion.ul className="intro-facts" variants={rise}>
          {FACTS.map((fact) => <li key={fact}>{fact}</li>)}
        </motion.ul>
        <motion.div className="intro-actions" variants={rise}>
          <button className="everyday-btn primary" type="button" onClick={scrollToModel}>شروع ↓</button>
          <button className="everyday-btn" type="button" onClick={onPreview}>خلاصه رزومه ↗</button>
          <a className="everyday-btn" href={`https://t.me/${CONTACT.telegram}`} target="_blank" rel="noreferrer">تماس در تلگرام</a>
        </motion.div>
      </motion.div>
      <div className="intro-cue" aria-hidden="true">
        <span>اسکرول کن تا مرا ببینی</span>
        <span className="scroll-cue-track"><span className="scroll-cue-dot" /></span>
      </div>
    </section>
  )
}
