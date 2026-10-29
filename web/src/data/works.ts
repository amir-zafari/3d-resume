export interface WorkListItem {
  name: string
  meta?: string
  tags?: string[]
  link?: string
  slug?: string
}

export interface WorkGroup { heading: string; items: string[] }

export interface WorkSection {
  id: string
  no: string
  title: string
  tagline: string
  items?: WorkListItem[]
  groups?: WorkGroup[]
  awards?: string[]
  footer?: string
}

export interface WorksCopy {
  title: string
  closeLabel: string
  openLabel: string
  hint: string
  awardsLabel: string
  visitLabel: string
  detailPlaceholder: string
  phImageLabel: string
  phButtonLabel: string
  countLabel: (n: number) => string
  sections: WorkSection[]
}

export const WORKS: WorksCopy = {
  title: 'نمونه‌کارها', closeLabel: 'بازگشت', openLabel: 'مشاهده', hint: 'ادامه بده', awardsLabel: 'افتخارات', visitLabel: 'مشاهده سایت',
  detailPlaceholder: 'توضیحات کامل این پروژه به‌زودی اضافه می‌شود.', phImageLabel: 'تصویر / ویدیو پروژه', phButtonLabel: 'لینک پروژه', countLabel: (n) => `${n} پروژه`,
  sections: [
    { id: 'wordpress', no: '01', title: 'طراحی سایت با وردپرس', tagline: 'فروشگاه اینترنتی · قالب‌سازی · المنتور', items: [
      { name: 'فروشگاه اینترنتی بارسلون', meta: 'وردپرس', link: 'https://barcelon-group.ir/' },
      { name: 'فروشگاه اینترنتی بصیر شاپ', meta: 'وردپرس', link: 'https://basir.store/' },
      { name: 'فروشگاه اینترنتی فروترد', meta: 'وردپرس', link: 'https://fruitord.ir/' },
      { name: 'فروشگاه اینترنتی صباغ زاده', meta: 'وردپرس', link: 'https://sabbaghzadehco.com/' },
      { name: 'فروشگاه اینترنتی مجموعه سید جوادی', meta: 'وردپرس', link: 'https://seyyedjavadi.com/' },
      { name: 'تغییرات در سایت نمایشگاه بین‌المللی مشهد', meta: 'وردپرس', link: 'https://expo.ir/' },
      { name: 'وبلاگ سایت وکیل باشی', meta: 'وردپرس', link: 'https://vakilbashi.org/mag' },
      { name: 'سایت تیم برنامه‌نویسی وبلو', meta: 'وردپرس', link: 'https://webello.ir/' },
    ] },
    { id: 'laravel', no: '02', title: 'توسعه وب با لاراول', tagline: 'بک‌اند · پنل‌ها · سیستم‌های سازمانی', items: [
      { name: 'چت سازمانی بارسلون', meta: 'Laravel', link: 'https://chat.barcelon-group.ir/' },
      { name: 'پنل خدماتی و تعمیراتی بارسلون', meta: 'Laravel', link: 'https://service.barcelon-group.ir/' },
      { name: 'چت روم شخصی', meta: 'Laravel', link: 'https://webello.zlc.ir/room/' },
      { name: 'پنل بیمه', meta: 'Laravel', link: 'https://bime5.zlc.ir/bime5/ho.php' },
    ] },
    { id: 'bots', no: '03', title: 'ربات‌های تلگرامی', tagline: 'توسعه با PHP', items: [
      { name: 'ربات تلگرامی ستی', meta: 'PHP', link: 'https://t.me/stijoon_bot' },
      { name: 'ربات تلگرامی دکتر امیرحسین جمالپور', meta: 'PHP', link: 'https://t.me/stijoon_bot' },
      { name: 'ربات تلگرامی ولت یاب', meta: 'PHP' },
    ] },
    { id: 'apps', no: '04', title: 'اپلیکیشن‌ها', tagline: 'اندروید · Java', items: [
      { name: 'تصویرسازی لغات ۵۰۴ و تافل', meta: 'اندروید', link: 'https://cafebazaar.ir/app/com.faramuz.learnEn' },
      { name: 'برنامه آموزش ضرب «ضرب جنگلی»', meta: 'اندروید', link: 'https://cafebazaar.ir/app/ir.webello.greatrace' },
      { name: 'اپلیکیشن ورود و خروج کارکنان', meta: 'اندروید' },
      { name: 'پروکسی‌یاب MTProxy', meta: 'اندروید' },
      { name: 'Tebot، مدیریت کانال‌های تلگرامی', meta: 'اندروید' },
    ] },
    { id: 'n8n', no: '05', title: 'اتوماسیون با n8n', tagline: 'گردش‌کارهای خودکار · هوش مصنوعی', items: [
      { name: 'سیستم خودکار آپدیت قیمت وردپرس', meta: 'n8n' },
      { name: 'سیستم خودکار نوشتن مقاله در وردپرس', meta: 'n8n' },
      { name: 'سیستم ارسال اخبار مرتبط به تلگرام', meta: 'n8n' },
      { name: 'انتخاب هوشمند موضوع برای ریلز، استوری و مقاله', meta: 'n8n' },
      { name: 'سیستم پشتیبانی مشتری در تلگرام', meta: 'n8n' },
      { name: 'ربات تلگرامی همه‌کاره', meta: 'n8n' },
    ] },
    { id: 'python', no: '06', title: 'پایتون و خزنده وب', tagline: 'اتوماسیون · مدل‌های تصمیم‌گیری', items: [
      { name: 'مدل تصمیم‌گیری انتخاب تعمیرکار', meta: 'Python' },
      { name: 'مدیریت پنل فروشندگان دیوار', meta: 'Python' },
      { name: 'سئوی خودکار اولیه سایت‌های سایت‌ساز سی‌فایو', meta: 'Python' },
      { name: 'سیستم خودکار ثبت محصولات در وردپرس', meta: 'Python' },
      { name: 'ماینر هوشمند ارز ناتکوین', meta: 'Python' },
    ] },
  ],
}

export const SECTION_COVERS: Record<string, string> = {}

export function sectionCount(section: WorkSection): number {
  if (section.items) return section.items.length
  if (section.groups) return section.groups.reduce((n, group) => n + group.items.length, 0)
  return 0
}
