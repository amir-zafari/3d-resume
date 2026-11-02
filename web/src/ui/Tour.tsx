import { useEffect, useRef, type CSSProperties, type RefObject } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CONTACT, TOUR, type TourStep } from '../data/tour'
import { useTour } from '../store'

const EASE = [0.22, 1, 0.36, 1] as const
const fa = (n: number) => n.toLocaleString('fa-IR')
const LAST = TOUR.length - 1

// Wheel, keys and swipes move between steps; the page itself never scrolls. Inside the card, its
// own overflow scrolls first so a long step on a small phone stays readable.
function useTourInput(scrollerRef: RefObject<HTMLElement>) {
  useEffect(() => {
    let lockedUntil = 0
    let wheel = 0
    let lastWheel = 0
    let touch: { x: number; y: number; inScroller: boolean } | null = null

    const modalOpen = () => document.querySelector('.resume-preview') !== null
    const move = (direction: 1 | -1) => {
      const now = performance.now()
      if (now < lockedUntil) return
      lockedUntil = now + 650
      const { next, prev } = useTour.getState()
      if (direction > 0) next()
      else prev()
    }
    const scrollerCanScroll = (target: EventTarget | null, down: boolean) => {
      const scroller = scrollerRef.current
      if (!scroller || !(target instanceof Node) || !scroller.contains(target)) return false
      return down ? scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 1 : scroller.scrollTop > 0
    }

    const onWheel = (event: WheelEvent) => {
      if (modalOpen() || scrollerCanScroll(event.target, event.deltaY > 0)) return
      const now = performance.now()
      if (now - lastWheel > 250) wheel = 0
      lastWheel = now
      wheel += event.deltaY
      if (Math.abs(wheel) < 40) return
      move(wheel > 0 ? 1 : -1)
      wheel = 0
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (modalOpen() || event.altKey || event.ctrlKey || event.metaKey) return
      // Right-to-left page: "next" points left.
      if (['ArrowLeft', 'ArrowDown', 'PageDown'].includes(event.key)) move(1)
      else if (['ArrowRight', 'ArrowUp', 'PageUp'].includes(event.key)) move(-1)
      else if (event.key === 'Home') useTour.getState().go(0)
      else if (event.key === 'End') useTour.getState().go(LAST)
      else return
      event.preventDefault()
    }
    const onTouchStart = (event: TouchEvent) => {
      const point = event.touches[0]
      const scroller = scrollerRef.current
      const inScroller = !!scroller && event.target instanceof Node && scroller.contains(event.target) && scroller.scrollHeight > scroller.clientHeight
      touch = { x: point.clientX, y: point.clientY, inScroller }
    }
    const onTouchEnd = (event: TouchEvent) => {
      if (!touch || modalOpen()) return
      const point = event.changedTouches[0]
      const dx = point.clientX - touch.x
      const dy = point.clientY - touch.y
      const start = touch
      touch = null
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return
      // Right-to-left: dragging the content to the right brings in the next step.
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 1 : -1)
      else if (!start.inScroller) move(dy < 0 ? 1 : -1)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [scrollerRef])
}

function StepContent({ data, index, onFullResume }: { data: TourStep; index: number; onFullResume: () => void }) {
  const { go, next } = useTour.getState()
  const Title = index === 0 ? 'h1' : 'h2'
  return (
    <>
      <p className="tour-eyebrow">{data.eyebrow}</p>
      <Title className="tour-title">{data.title}</Title>
      {data.text && <p className="tour-text">{data.text}</p>}
      {data.facts && (
        <ul className="tour-facts">
          {data.facts.map((fact) => <li key={fact}>{fact}</li>)}
        </ul>
      )}
      {data.items && (
        <ol className={`tour-items${data.items.some((item) => item.href) ? ' is-links' : ''}`}>
          {data.items.map((item, i) => (
            <li key={item.title} style={{ '--i': i } as CSSProperties}>
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer">
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                  <span className="tour-item-go" aria-hidden="true">↗</span>
                </a>
              ) : (
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      {data.footnote && (
        <p className="tour-footnote">
          {data.footnote}{' '}
          <button type="button" onClick={onFullResume}>دیدن رزومه کامل</button>
        </p>
      )}
      {index === 0 && (
        <div className="tour-actions">
          <button className="tour-btn primary" type="button" onClick={next}>شروع کنیم ←</button>
          <button className="tour-btn" type="button" onClick={() => go(LAST)}>همین الان صحبت کنیم</button>
        </div>
      )}
      {index === LAST && (
        <div className="tour-actions is-contact">
          <a className="tour-btn primary" href={`https://t.me/${CONTACT.telegram}?text=${encodeURIComponent(CONTACT.telegramGreeting)}`} target="_blank" rel="noreferrer">پیام در تلگرام</a>
          <div className="tour-actions-row">
            <a className="tour-btn" href={`tel:${CONTACT.phone}`} aria-label={`تماس تلفنی ${CONTACT.phoneLabel}`}>تماس تلفنی</a>
            <a className="tour-btn" href={`mailto:${CONTACT.email}`} aria-label={`ایمیل ${CONTACT.email}`}>ایمیل</a>
          </div>
        </div>
      )}
      {/* Testimonials come after the contact buttons, so the buttons stay in view on small screens. */}
      {data.quotes && (
        <div className="tour-quotes">
          {data.quotes.map((quote) => (
            <figure key={quote.name}>
              <blockquote>«{quote.text}»</blockquote>
              <figcaption>{quote.name}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {index === LAST && (
        <p className="tour-end-links">
          <a className="tour-link" href={`https://github.com/${CONTACT.github}`} target="_blank" rel="noreferrer">کدهای من در گیت‌هاب</a>
          <button className="tour-link" type="button" onClick={() => go(0)}>دیدن دوباره از اول</button>
        </p>
      )}
    </>
  )
}

export default function Tour({ onFullResume }: { onFullResume: () => void }) {
  const step = useTour((s) => s.step)
  const { go, next, prev } = useTour.getState()
  const scrollerRef = useRef<HTMLDivElement>(null)
  useTourInput(scrollerRef)

  // Each step starts at its top.
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [step])

  const data = TOUR[step]
  return (
    <main className="tour" lang="fa">
      <section className="tour-card" aria-roledescription="اسلاید" aria-label={`${data.label}، قدم ${fa(step + 1)} از ${fa(TOUR.length)}`}>
        <div className="tour-scroll" ref={scrollerRef}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={data.id}
              className={`tour-body is-${data.id}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <StepContent data={data} index={step} onFullResume={onFullResume} />
            </motion.div>
          </AnimatePresence>
        </div>
        <nav className="tour-nav" aria-label="قدم‌ها">
          <button className="tour-arrow" type="button" onClick={prev} disabled={step === 0} aria-label="قدم قبلی">→</button>
          <div className="tour-dots">
            {TOUR.map((item, i) => (
              <button key={item.id} type="button" className="tour-dot" onClick={() => go(i)} aria-label={item.label} aria-current={i === step ? 'step' : undefined}>
                <span />
              </button>
            ))}
          </div>
          <span className="tour-count">{fa(step + 1)} از {fa(TOUR.length)}</span>
          <button className="tour-arrow next" type="button" onClick={next} disabled={step === LAST} aria-label="قدم بعدی">
            بعدی ←
          </button>
        </nav>
      </section>
    </main>
  )
}
