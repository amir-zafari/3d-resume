# رزومه سه‌بعدی امیر حسین ظفری

رزومه تعاملی و سه‌بعدی من: با اسکرول، دوربین روی برچسب‌های صورت و لباسم می‌رود و هر برچسب یک بخش از رزومه را نشان می‌دهد؛ اول اطلاعات شخصی (گونه‌ها)، بعد مهارت‌ها (شانه راست و جلوی کت) و بعد سوابق کاری (شانه چپ)، و در آخر نمونه‌کارها.

**مشاهده آنلاین:** https://amir-zafari.github.io/3d-resume/

## اجرا روی سیستم

```bash
cd web
npm install
npm run dev      # http://localhost:5173
npm run build    # خروجی در web/dist
```

با هر push روی شاخه `main`، سایت به‌صورت خودکار با GitHub Actions ساخته و روی GitHub Pages منتشر می‌شود (`.github/workflows/deploy.yml`).

## تغییر محتوا

| چه چیزی | کجا |
| --- | --- |
| متن رزومه (درباره من، مهارت‌ها، سوابق) | `web/src/data/resume.ts` |
| برچسب‌ها و جایشان روی مدل | `web/src/scene/stickers.ts` |
| نمونه‌کارها | `web/src/data/works.ts` |
| بخش پایانی و نظر مشتری‌ها | `web/src/ui/Everyday.tsx` |
| صفحه اول | `web/src/ui/Intro.tsx` |

ترتیب آیتم‌های رزومه با عدد `focus` برچسب‌ها جور است: آیتم شماره N (از ۰) نمای نزدیک برچسبی است که `focus: N` دارد.

## ساخته‌شده با

React · TypeScript · React Three Fiber · three.js · framer-motion · Vite

## قدردانی

- کد صحنه و ساختار اسکرول بر پایه پروژه متن‌باز [sen-3d-resume](https://github.com/dayinji/sen-3d-resume) از Sen Zheng (مجوز MIT) است؛ محتوا، مدل سه‌بعدی، برچسب‌ها و چشم‌های متحرک مخصوص این نسخه هستند.
- مدل سه‌بعدی با [Tripo](https://www.tripo3d.ai/) از عکس خودم ساخته شده است.
- لوگوهای برچسب‌ها از [Simple Icons](https://simpleicons.org/) (CC0)؛ نشان‌های تجاری متعلق به صاحبانشان هستند.
