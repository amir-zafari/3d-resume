// The full portfolio, listed in the full-résumé window (ui/ResumePreview.tsx).
import type { LogoKey } from './logos'

export interface WorkListItem {
  name: string
  meta?: string
  link?: string
  logo?: LogoKey
}

export interface WorkSection {
  id: string
  title: string
  items: WorkListItem[]
}

export const WORKS: { sections: WorkSection[] } = {
  sections: [
    { id: 'sites', title: 'سایت و فروشگاه اینترنتی', items: [
      { name: 'سایت اصلی و فروشگاه بارسلون', meta: 'وردپرس', link: 'https://barcelon-group.ir/', logo: 'barcelon' },
      { name: 'گالری آرتیفکس، فروش طلا', meta: 'در حال توسعه', link: 'https://gallery-artifex.ir/', logo: 'artifex' },
      { name: 'سایت استرومکس', meta: 'وردپرس', link: 'https://estiromex.ir/' },
      { name: 'سایت خبری آتاری', link: 'https://atari-shop.ir/', logo: 'atari' },
      { name: 'فروشگاه اینترنتی بصیر شاپ', meta: 'وردپرس', link: 'https://basir.store/' },
      { name: 'فروشگاه اینترنتی فروترد', meta: 'وردپرس', link: 'https://fruitord.ir/', logo: 'fruitord' },
      { name: 'فروشگاه اینترنتی صباغ زاده', meta: 'وردپرس', link: 'https://sabbaghzadehco.com/' },
      { name: 'فروشگاه اینترنتی مجموعه سید جوادی', meta: 'وردپرس', link: 'https://seyyedjavadi.com/' },
      { name: 'تغییرات در سایت نمایشگاه بین‌المللی مشهد', meta: 'وردپرس', link: 'https://expo.ir/' },
      { name: 'وبلاگ سایت وکیل باشی', meta: 'وردپرس', link: 'https://vakilbashi.org/mag', logo: 'vakilbashi' },
      { name: 'سایت تیم برنامه‌نویسی وبلو', meta: 'وردپرس', link: 'https://webello.ir/', logo: 'webello' },
    ] },
    { id: 'panels', title: 'پنل مدیریت و سامانه‌های سازمانی', items: [
      { name: 'پنل مدیریت پرونده بیماران دکتر کمندی', meta: 'در حال توسعه', link: 'https://drkamandi.ir/', logo: 'drkamandi' },
      { name: 'پنل خدمات پس از فروش بارسلون', meta: 'Laravel', link: 'https://service.barcelon-group.ir/auth', logo: 'barcelon' },
      { name: 'پنل خدمات پس از فروش آتاری', link: 'https://service.atari-shop.ir/auth', logo: 'atari' },
      { name: 'چت درون‌سازمانی بارسلون', meta: 'Laravel', link: 'https://chat.barcelon-group.ir/', logo: 'barcelon' },
      { name: 'سایت مستندات بارسلون و آتاری', link: 'https://docservice.barcelon-group.ir/', logo: 'barcelon' },
      { name: 'چت روم شخصی', meta: 'Laravel', link: 'https://webello.zlc.ir/room/' },
      { name: 'پنل بیمه', meta: 'Laravel', link: 'https://bime5.zlc.ir/bime5/ho.php' },
    ] },
    { id: 'apps', title: 'اپلیکیشن‌ها', items: [
      { name: 'چکدان، مدیریت چک', meta: 'اندروید · کافه‌بازار', link: 'https://cafebazaar.ir/app/ir.webello.check_management' },
      { name: 'YAZAN، مدیریت کد', meta: 'اندروید · تحویل‌شده به مشتری', logo: 'yazan' },
      { name: 'مدیریت سفارش، انبار و سفارش پیامکی با هوش مصنوعی محلی', meta: 'اندروید' },
      { name: 'تصویرسازی لغات ۵۰۴ و تافل', meta: 'اندروید · کافه‌بازار', link: 'https://cafebazaar.ir/app/com.faramuz.learnEn' },
      { name: 'برنامه آموزش ضرب «ضرب جنگلی»', meta: 'اندروید · کافه‌بازار', link: 'https://cafebazaar.ir/app/ir.webello.greatrace' },
      { name: 'اپلیکیشن ورود و خروج کارکنان', meta: 'اندروید' },
      { name: 'پروکسی‌یاب MTProxy', meta: 'اندروید' },
      { name: 'Tebot، مدیریت کانال‌های تلگرامی', meta: 'اندروید' },
    ] },
    { id: 'bots', title: 'ربات و هوش مصنوعی', items: [
      { name: 'مدیریت خودکار اکانت تلگرام با هوش مصنوعی', meta: 'هوش مصنوعی' },
      { name: 'ربات مشتری‌یاب تلگرام', meta: 'هوش مصنوعی پیام‌ها را می‌خواند و مشتری پیدا می‌کند' },
      { name: 'ربات تلگرامی ستی', meta: 'PHP', link: 'https://t.me/stijoon_bot' },
      { name: 'ربات تلگرامی دکتر امیرحسین جمالپور', meta: 'PHP' },
      { name: 'ربات تلگرامی ولت یاب', meta: 'PHP' },
    ] },
    { id: 'n8n', title: 'اتوماسیون با n8n', items: [
      { name: 'سیستم خودکار آپدیت قیمت وردپرس', meta: 'n8n' },
      { name: 'سیستم خودکار نوشتن مقاله در وردپرس', meta: 'n8n' },
      { name: 'سیستم ارسال اخبار مرتبط به تلگرام', meta: 'n8n' },
      { name: 'انتخاب هوشمند موضوع برای ریلز، استوری و مقاله', meta: 'n8n' },
      { name: 'سیستم پشتیبانی مشتری در تلگرام', meta: 'n8n' },
      { name: 'ربات تلگرامی همه‌کاره', meta: 'n8n' },
    ] },
    { id: 'python', title: 'پایتون و خزنده وب', items: [
      { name: 'مدل تصمیم‌گیری انتخاب تعمیرکار', meta: 'Python' },
      { name: 'مدیریت پنل فروشندگان دیوار', meta: 'Python' },
      { name: 'سئوی خودکار اولیه سایت‌های سایت‌ساز سی‌فایو', meta: 'Python', logo: 'see5' },
      { name: 'سیستم خودکار ثبت محصولات در وردپرس', meta: 'Python' },
      { name: 'ماینر هوشمند ارز ناتکوین', meta: 'Python' },
    ] },
  ],
}

// Every project in the list, for the counts shown in the tour.
export const WORK_COUNT = WORKS.sections.reduce((sum, section) => sum + section.items.length, 0)
