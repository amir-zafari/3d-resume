import { animate, motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { siAndroid, siElementor, siJavascript, siLaravel, siN8n, siOpenai, siPhp, siPython, siSelenium, siTelegram, siWordpress, type SimpleIcon } from 'simple-icons'

const STATS = [
  { value: 1395, prefix: 'از ', label: 'سال شروع کار با وب', plain: true },
  { value: 30, prefix: '+', label: 'نمونه‌کار منتشرشده' },
  { value: 10, prefix: '+', label: 'تجربه و پروژه کاری' },
]

const CARDS: { title: string; text: string; tags: string[]; icon?: SimpleIcon }[] = [
  {
    title: 'اتوماسیون',
    text: 'از ساختن ابزارهایی که کارهای تکراری را خودکار می‌کنند لذت می‌برم؛ از گردش‌کارهای n8n تا کراولرهایی که با Selenium و PyAutoGUI نوشته‌ام.',
    tags: ['n8n', 'Selenium', 'PyAutoGUI'],
    icon: siN8n,
  },
  {
    title: 'هوش مصنوعی',
    text: 'هوش مصنوعی را در پروژه‌های واقعی به کار می‌برم؛ مثل ربات هوشمند تلگرام و پردازش داده‌ها با AI.',
    tags: ['ربات تلگرام', 'پردازش داده', 'AI'],
    icon: siOpenai,
  },
  {
    title: 'ساختن برای وب',
    text: 'از قالب‌سازی وردپرس و المنتور تا بک‌اند و پنل‌های مدیریتی با لاراول؛ هر پروژه را تا انتشار کامل پیش می‌برم.',
    tags: ['WordPress', 'Laravel', 'Elementor'],
    icon: siWordpress,
  },
  {
    title: 'یادگیری مداوم',
    text: 'از سال ۱۳۹۵ در دنیای وب هستم و هنوز هر هفته چیز تازه‌ای یاد می‌گیرم؛ ابزارهای جدید را زود امتحان می‌کنم.',
    tags: ['کنجکاوی', 'ابزارهای نو', 'تمرین'],
  },
]

const TESTIMONIALS = [
  { name: 'حاجی پیر فرخانی', text: 'در سریع‌ترین حالت ممکن سایت من را آماده کرد و خیلی سریع اولین سفارش را گرفتم. اولین سفارش سایت خیلی دلنشین بود، تشکر.' },
  { name: 'دکتر امیرحسین جمالپور', text: 'از همکاری با جناب ظفری بسیار راضی بودم؛ پروژه را در اسرع وقت تحویل دادند و باگ‌های ربات را سریع برطرف کردند. پروژه‌های بعدی را هم با ایشان جلو می‌برم.' },
]

const MARQUEE = [siWordpress, siLaravel, siPhp, siPython, siN8n, siTelegram, siOpenai, siSelenium, siElementor, siJavascript, siAndroid]

const fa = (n: number) => n.toLocaleString('fa-IR', { useGrouping: false })

function Icon({ icon, size = 22 }: { icon: SimpleIcon; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={icon.path} fill="currentColor" />
    </svg>
  )
}

function Spark() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
      <path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" fill="currentColor" />
    </svg>
  )
}

function CountUp({ to, plain }: { to: number; plain?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const [value, setValue] = useState(plain ? to : 0)
  useEffect(() => {
    if (!inView || plain) return
    const controls = animate(0, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setValue(Math.round(v)) })
    return () => controls.stop()
  }, [inView, to, plain])
  return <span ref={ref}>{fa(value)}</span>
}

const EASE = [0.22, 1, 0.36, 1] as const
const reveal = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }

export default function Everyday() {
  return (
    <section className="everyday" lang="fa" aria-labelledby="everyday-title">
      <div className="everyday-glow" aria-hidden="true" />
      <motion.div className="everyday-inner" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-15% 0px' }}>
        <motion.p className="everyday-eyebrow" variants={reveal}>فراتر از رزومه</motion.p>
        <motion.h2 id="everyday-title" variants={reveal}>
          کدنویسی برای من <em>فقط کار</em> نیست
        </motion.h2>
        <motion.p className="everyday-intro" variants={reveal}>
          چیزهایی که مرا جلو می‌برند؛ علاقه‌هایی که پشت هر پروژه هستند.
        </motion.p>

        <motion.dl className="everyday-stats" variants={stagger}>
          {STATS.map((stat) => (
            <motion.div key={stat.label} className="everyday-stat" variants={reveal}>
              <dt>{stat.label}</dt>
              <dd>
                {stat.prefix}
                <CountUp to={stat.value} plain={stat.plain} />
              </dd>
            </motion.div>
          ))}
        </motion.dl>

        <motion.div className="everyday-grid" variants={stagger}>
          {CARDS.map((card, index) => (
            <motion.article key={card.title} className="everyday-card" variants={reveal} whileHover={{ y: -6 }}>
              <div className="everyday-card-top">
                <span className="everyday-card-icon">{card.icon ? <Icon icon={card.icon} /> : <Spark />}</span>
                <span className="everyday-card-no">{fa(index + 1).padStart(2, '۰')}</span>
              </div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <ul>
                {card.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>

      <motion.div className="everyday-quotes" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-10% 0px' }}>
        <motion.h3 variants={reveal}>نظر مشتری‌ها</motion.h3>
        <div>
          {TESTIMONIALS.map((quote) => (
            <motion.figure key={quote.name} variants={reveal}>
              <blockquote>«{quote.text}»</blockquote>
              <figcaption>{quote.name}</figcaption>
            </motion.figure>
          ))}
        </div>
      </motion.div>

      <div className="everyday-marquee" aria-label="ابزارهایی که با آن‌ها کار می‌کنم">
        <div className="everyday-marquee-track">
          {[...MARQUEE, ...MARQUEE].map((icon, i) => (
            <span key={`${icon.slug}-${i}`} aria-hidden={i >= MARQUEE.length}>
              <Icon icon={icon} size={18} />
              {icon.title}
            </span>
          ))}
        </div>
      </div>

      <motion.div className="everyday-cta" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE }}>
        <p>برای همکاری یا یک پروژه تازه آماده‌ام.</p>
        <div>
          <a className="everyday-btn primary" href="https://amir-zafari.github.io/resume/" target="_blank" rel="noreferrer">
            رزومه کامل و راه‌های ارتباطی ↗
          </a>
          <button className="everyday-btn" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            بازگشت به بالا ↑
          </button>
        </div>
      </motion.div>
    </section>
  )
}
