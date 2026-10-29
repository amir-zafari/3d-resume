import { motion } from 'framer-motion'
import { FOCUS_POINTS } from '../data/focusPoints'
import { CHAPTERS, type ResumeEntry } from '../data/resume'

const EASE = [0.22, 1, 0.36, 1]
const containerV = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } } }
const itemV = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } } }
const fa = (n: number) => n.toLocaleString('fa-IR')

function Entry({ entry, index }: { entry: ResumeEntry; index: number }) {
  return (
    <motion.div className="tl-entry" data-point={FOCUS_POINTS[index]} variants={containerV} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-12% 0px -12% 0px' }}>
      <motion.span className="tl-dot" variants={itemV} aria-hidden="true" />
      <div className="tl-body">
        <motion.div className="tl-period" variants={itemV}>{entry.period}</motion.div>
        <motion.div className="tl-head" variants={itemV}><h3 className="tl-place">{entry.place}</h3></motion.div>
        {entry.role && <motion.div className="tl-role" variants={itemV}>{entry.role}</motion.div>}
        {entry.skills && (
          <motion.ul className="tl-skills" variants={itemV}>
            {entry.skills.map((skill) => (
              <li key={skill.name}>
                <span className="tl-skill-name">{skill.name}</span>
                <span className="tl-skill-level">{fa(skill.level)}٪</span>
                {/* The track is what gets observed: a fill scaled to 0 has no area, so it never counts as in view. */}
                <motion.span className="tl-skill-bar" initial="empty" whileInView="full" viewport={{ once: true, margin: '0px 0px -10% 0px' }}>
                  <motion.span variants={{ empty: { scaleX: 0 }, full: { scaleX: skill.level / 100, transition: { duration: 1.1, ease: EASE, delay: 0.25 } } }} />
                </motion.span>
              </li>
            ))}
          </motion.ul>
        )}
        {entry.links && (
          <motion.ul className="tl-links" variants={itemV}>
            {entry.links.map((link) => (
              <li key={link.href}>
                <span>{link.label}</span>
                <a href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" dir="ltr">{link.value}</a>
              </li>
            ))}
          </motion.ul>
        )}
        {entry.points && <motion.ul className="tl-points" variants={itemV}>{entry.points.map((point) => <li key={point}>{point}</li>)}</motion.ul>}
      </div>
    </motion.div>
  )
}

// Running entry number where each chapter starts, so focus indices count across chapters.
const CHAPTER_START = CHAPTERS.map((_, c) => CHAPTERS.slice(0, c).reduce((n, ch) => n + ch.entries.length, 0))

export default function Resume() {
  return (
    <section className="resume" lang="fa">
      <motion.h2 className="resume-title" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-10% 0px' }} transition={{ duration: 0.7, ease: EASE }}>رزومه</motion.h2>
      <div className="timeline">
        {CHAPTERS.map((chapter, c) => (
          <div className="tl-chapter" key={chapter.title}>
            <motion.h3 className="tl-chapter-title" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-15% 0px' }} transition={{ duration: 0.6, ease: EASE }}>{chapter.title}</motion.h3>
            {chapter.entries.map((entry, e) => <Entry key={entry.place} entry={entry} index={CHAPTER_START[c] + e} />)}
          </div>
        ))}
      </div>
    </section>
  )
}
