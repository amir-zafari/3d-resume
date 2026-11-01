// The full portfolio, listed in the full-résumé window (ui/ResumePreview.tsx).
export interface WorkListItem {
  name: string
  meta?: string
  link?: string
}

export interface WorkSection {
  id: string
  title: string
  items: WorkListItem[]
}

export const WORKS: { sections: WorkSection[] } = {
  sections: [
    { id: 'wordpress', title: 'طراحی سایت با وردپرس', items: [
      { name: 'فروشگاه اینترنتی بارسلون', meta: 'وردپرس', link: 'https://barcelon-group.ir/' },
      { name: 'فروشگاه اینترنتی بصیر شاپ', meta: 'وردپرس', link: 'https://basir.store/' },
      { name: 'فروشگاه اینترنتی فروترد', meta: 'وردپرس', link: 'https://fruitord.ir/' },
      { name: 'فروشگاه اینترنتی صباغ زاده', meta: 'وردپرس', link: 'https://sabbaghzadehco.com/' },
      { name: 'فروشگاه اینترنتی مجموعه سید جوادی', meta: 'وردپرس', link: 'https://seyyedjavadi.com/' },
      { name: 'تغییرات در سایت نمایشگاه بین‌المللی مشهد', meta: 'وردپرس', link: 'https://expo.ir/' },
      { name: 'وبلاگ سایت وکیل باشی', meta: 'وردپرس', link: 'https://vakilbashi.org/mag' },
      { name: 'سایت تیم برنامه‌نویسی وبلو', meta: 'وردپرس', link: 'https://webello.ir/' },
    ] },
    { id: 'laravel', title: 'توسعه وب با لاراول', items: [
      { name: 'چت سازمانی بارسلون', meta: 'Laravel', link: 'https://chat.barcelon-group.ir/' },
      { name: 'پنل خدماتی و تعمیراتی بارسلون', meta: 'Laravel', link: 'https://service.barcelon-group.ir/' },
      { name: 'چت روم شخصی', meta: 'Laravel', link: 'https://webello.zlc.ir/room/' },
      { name: 'پنل بیمه', meta: 'Laravel', link: 'https://bime5.zlc.ir/bime5/ho.php' },
    ] },
    { id: 'bots', title: 'ربات‌های تلگرامی', items: [
      { name: 'ربات تلگرامی ستی', meta: 'PHP', link: 'https://t.me/stijoon_bot' },
      { name: 'ربات تلگرامی دکتر امیرحسین جمالپور', meta: 'PHP', link: 'https://t.me/stijoon_bot' },
      { name: 'ربات تلگرامی ولت یاب', meta: 'PHP' },
    ] },
    { id: 'apps', title: 'اپلیکیشن‌ها', items: [
      { name: 'تصویرسازی لغات ۵۰۴ و تافل', meta: 'اندروید', link: 'https://cafebazaar.ir/app/com.faramuz.learnEn' },
      { name: 'برنامه آموزش ضرب «ضرب جنگلی»', meta: 'اندروید', link: 'https://cafebazaar.ir/app/ir.webello.greatrace' },
      { name: 'اپلیکیشن ورود و خروج کارکنان', meta: 'اندروید' },
      { name: 'پروکسی‌یاب MTProxy', meta: 'اندروید' },
      { name: 'Tebot، مدیریت کانال‌های تلگرامی', meta: 'اندروید' },
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
      { name: 'سئوی خودکار اولیه سایت‌های سایت‌ساز سی‌فایو', meta: 'Python' },
      { name: 'سیستم خودکار ثبت محصولات در وردپرس', meta: 'Python' },
      { name: 'ماینر هوشمند ارز ناتکوین', meta: 'Python' },
    ] },
  ],
}
