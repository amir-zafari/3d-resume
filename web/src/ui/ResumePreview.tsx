import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CONTACT } from '../data/resume'

const SKILLS = ['WordPress', 'Elementor', 'PHP', 'Laravel', 'Python', 'n8n', 'Java / Android', 'JavaScript']

export function ResumePreview({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button className="resume-preview-backdrop" aria-label="بستن" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="resume-preview" role="dialog" aria-modal="true" aria-label="خلاصه رزومه" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.35 }}>
            <button className="resume-preview-close" onClick={onClose} aria-label="بستن">✕</button>
            <p className="resume-preview-eyebrow">خلاصه رزومه</p>
            <h2>امیر حسین ظفری</h2>
            <p className="resume-preview-intro">توسعه‌دهنده وب با تمرکز بر وردپرس، لاراول و اتوماسیون مبتنی بر هوش مصنوعی.</p>
            <dl className="resume-preview-grid">
              <div><dt>تحصیلات</dt><dd>{'کارشناسی مهندسی نرم‌افزار\nدانشگاه غیرانتفاعی توس'}</dd></div>
              <div><dt>زمینه‌های کاری</dt><dd>توسعه وب · طراحی سایت وردپرس · اتوماسیون · هوش مصنوعی</dd></div>
              <div><dt>تماس</dt><dd className="resume-preview-contact"><a href={`mailto:${CONTACT.email}`} dir="ltr">{CONTACT.email}</a><a href={`https://t.me/${CONTACT.telegram}`} target="_blank" rel="noreferrer" dir="ltr">@{CONTACT.telegram}</a><a href={`tel:${CONTACT.phone}`} dir="ltr">{CONTACT.phoneLabel}</a></dd></div>
              <div><dt>محل زندگی</dt><dd>مشهد، ایران</dd></div>
            </dl>
            <section className="resume-preview-skills" aria-label="مهارت‌ها">
              <p>مهارت‌ها</p>
              <div>{SKILLS.map((skill) => <span key={skill}>{skill}</span>)}</div>
            </section>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
