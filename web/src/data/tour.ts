import { WORK_COUNT } from './works'

// The guided tour: a few short steps written for clients, not recruiters. On each step the camera
// flies to the shot named by `camera`: the opening shot of the whole model, or the stickers whose
// `focus` ids (scene/stickers.ts) are listed, framed together.

export const CONTACT = {
  email: '13am13ir@gmail.com',
  telegram: 'Amirzzz81',
  phone: '+989960242066',
  phoneLabel: '۰۹۹۶۰۲۴۲۰۶۶',
}

export interface TourItem {
  title: string
  text: string
  href?: string
}

export interface TourStep {
  id: string
  // Short label for the progress dots and screen readers.
  label: string
  camera: 'hero' | number[]
  eyebrow: string
  title: string
  text?: string
  facts?: string[]
  items?: TourItem[]
  quotes?: { name: string; text: string }[]
  footnote?: string
}

const fa = (n: number) => n.toLocaleString('fa-IR')

// The few projects shown on the portfolio step; the rest are in the full résumé (data/works.ts).
const WORK_HIGHLIGHTS: TourItem[] = [
  { title: 'فروشگاه بارسلون', text: 'سایت اصلی و فروشگاه', href: 'https://barcelon-group.ir/' },
  { title: 'گالری آرتیفکس', text: 'فروش طلا · در حال توسعه', href: 'https://gallery-artifex.ir/' },
  { title: 'چکدان', text: 'اپ مدیریت چک، کافه‌بازار', href: 'https://cafebazaar.ir/app/ir.webello.check_management' },
  { title: 'چت سازمانی بارسلون', text: 'پیام‌رسان داخلی شرکت', href: 'https://chat.barcelon-group.ir/' },
  { title: 'استرومکس', text: 'سایت وردپرسی', href: 'https://estiromex.ir/' },
  { title: 'لغات ۵۰۴ و تافل', text: 'اپ آموزشی، کافه‌بازار', href: 'https://cafebazaar.ir/app/com.faramuz.learnEn' },
]

export const TOUR: TourStep[] = [
  {
    id: 'hello',
    label: 'سلام',
    camera: 'hero',
    eyebrow: 'سلام، من امیرم',
    title: 'برای کسب‌وکار شما سایت و اپلیکیشن می‌سازم',
    text: 'از سال ۱۳۹۵ برای فروشگاه‌ها و کسب‌وکارها سایت، فروشگاه اینترنتی و اپ اندروید ساخته‌ام. در چند قدم کوتاه نشانتان می‌دهم.',
    facts: [`+${fa(Math.floor(WORK_COUNT / 10) * 10)} پروژه`, 'مشهد · همکاری از راه دور'],
  },
  {
    id: 'services',
    label: 'خدمات',
    // Every skill sticker: the right shoulder and the jacket front.
    camera: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    eyebrow: 'چه چیزی برایتان می‌سازم؟',
    title: 'هر چیزی که کسب‌وکارتان را آنلاین کند',
    items: [
      { title: 'سایت شرکتی و شخصی', text: 'ویترین آنلاین کسب‌وکارتان، زیبا روی گوشی و کامپیوتر' },
      { title: 'فروشگاه اینترنتی', text: 'فروش آنلاین با پرداخت اینترنتی و مدیریت ساده' },
      { title: 'اپلیکیشن اندروید', text: 'اپ اختصاصی برای مشتری یا کارمندان، در کافه‌بازار' },
      { title: 'ربات و کارهای خودکار', text: 'ربات تلگرام و انجام خودکار کارهای تکراری' },
    ],
  },
  {
    id: 'work',
    label: 'نمونه‌کارها',
    // Every company on the shoulder.
    camera: [14, 15, 16, 17, 18, 19, 20],
    eyebrow: 'نمونه‌کارهای واقعی',
    title: 'همه آنلاین هستند؛ خودتان ببینید',
    items: WORK_HIGHLIGHTS,
    footnote: `و ${fa(WORK_COUNT - WORK_HIGHLIGHTS.length)} پروژه دیگر در رزومه کامل.`,
  },
  {
    id: 'process',
    label: 'روند کار',
    camera: 'hero',
    eyebrow: 'کار با من چطور است؟',
    title: 'ساده و قدم‌به‌قدم',
    items: [
      { title: 'گفتگو', text: 'نیازتان را می‌شنوم و راه ساده پیشنهاد می‌دهم' },
      { title: 'طراحی', text: 'قبل از ساخت، ظاهر کار را می‌بینید' },
      { title: 'ساخت', text: 'در طول کار در جریان پیشرفت هستید' },
      { title: 'تحویل و پشتیبانی', text: 'آموزش استفاده و همراهی بعد از تحویل' },
    ],
  },
  {
    id: 'contact',
    label: 'تماس',
    camera: [1],
    eyebrow: 'بیایید شروع کنیم',
    title: 'یک پیام کافی است',
    text: 'بگویید چه چیزی در ذهن دارید؛ با هم درباره پروژه‌تان صحبت می‌کنیم.',
    quotes: [
      { name: 'حاجی پیر فرخانی', text: 'در سریع‌ترین حالت ممکن سایت من را آماده کرد و خیلی سریع اولین سفارش را گرفتم.' },
      { name: 'دکتر امیرحسین جمالپور', text: 'پروژه را در اسرع وقت تحویل دادند. پروژه‌های بعدی را هم با ایشان جلو می‌برم.' },
    ],
  },
]
