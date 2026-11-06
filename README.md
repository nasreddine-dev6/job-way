<div dir="rtl">

# جوبواي — JobWay 🚀

<p dir="rtl">
  <strong>منصة التوظيف الذكية العربية-first</strong> — منصة شاملة لإدارة التوظيف بواجهات عربية (RTL) متكاملة وثلاث لوحات تحكم لدور (المدير / باحث عن عمل / جهة توظيف).
</p>

---

## ✨ المزايا الرئيسية

| الميزة | الوصف |
| --- | --- |
| 🎯 **ثلاث لوحات تحكم** | لوحة مدير النظام، لوحة الباحث عن عمل، لوحة جهة التوظيف — كل واحدة مصممة لدورها. |
| 📝 **معالج بناء السيرة الذاتية (5 خطوات)** | wizard تفاعلي لبناء سيرة ذاتية احترافية مع رفع ملف PDF. |
| 💼 **إدارة الوظائف** | نشر، تعديل، حذف، فلترة (حسب النشاط/العقد/المهارة)، بحث، ترتيب. |
| 📨 **نظام التقديم** | تقديم على الوظائف، متابعة الحالة، تقييم، ملاحظات. |
| 💬 **الرسائل** | محادثات ثنائية بين الباحث وجهة التوظيف. |
| 🔔 **الإشعارات** | إشعارات فورية لكل تحديث (تقديم/قبول/رسالة). |
| 🌙 **الوضع الليلي/النهاري** | دعم كامل للثيمات عبر `next-themes`. |
| 📱 **تصميم متجاوب** | Mobile-first مع دعم RTL كامل وخط Cairo العربي. |
| 🔐 **مصادقة آمنة** | تشفير bcrypt لكلمات المرور، أدوار متعددة. |

---

## 🛠️ التقنيات المستخدمة

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + [shadcn/ui](https://ui.shadcn.com)
- **Database**: Prisma ORM (SQLite)
- **State**: Zustand
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Fonts**: Cairo (مستضاف محلياً)
- **Notifications**: Sonner

---

## 🚀 التشغيل محلياً (سهل وسريع)

### المتطلبات

- [Node.js](https://nodejs.org) >= 18
- [Bun](https://bun.sh) (مُوصى به) أو npm/pnpm/yarn

### الطريقة الأسهل (أمر واحد فقط!)

```bash
# 1. تثبيت الاعتمادات
bun install

# 2. تشغيل المشروع (يقوم بكل شيء تلقائياً!)
bun run dev
```

> ✨ **عند تشغيل `bun run dev` لأول مرة**، يقوم المشروع تلقائياً بـ:
> - إنشاء ملف `.env` من `.env.example` (إذا لم يكن موجوداً)
> - إنشاء مجلد `db/` لقاعدة البيانات
> - توليد Prisma Client
> - دفع مخطط قاعدة البيانات (إنشاء الجداول)
>
> ثم يبدأ خادم التطوير. لا حاجة لأي خطوات إضافية!

ثم افتح المتصفح على: <http://localhost:3000>

### الطريقة اليدوية (للمستخدمين المتقدمين)

```bash
bun install
cp .env.example .env          # إنشاء ملف البيئة
bun run db:generate           # توليد Prisma Client
bun run db:push               # إنشاء قاعدة البيانات والجداول
bun run dev                   # تشغيل خادم التطوير
```

### استكشاف الأخطاء

| المشكلة | الحل |
| --- | --- |
| `Can't reach database server` | تأكد من وجود مجلد `db/` وشغّل `bun run db:push` |
| `PrismaClient not found` | شغّل `bun run db:generate` أو `bun install` من جديد |
| الصفحة بيضاء | تحقق من وحدة التحكم (F12) — غالباً مشكلة في `.env` |
| لا أستطيع تسجيل الدخول | افتح الصفحة الرئيسية أولاً لإنشاء حسابات المعاينة تلقائياً |

---

## 🔑 بيانات الدخول الافتراضية (حسابات معاينة)

> 💡 تُنشأ هذه الحسابات **تلقائياً** عند فتح الصفحة الرئيسية لأول مرة،
> ويمكن أيضاً الدخول إليها بنقرة واحدة عبر أزرار **"حسابات معاينة سريعة"**
> الموجودة أسفل نموذج تسجيل الدخول.

| الدور | البريد الإلكتروني | كلمة المرور | الوصف |
| --- | --- | --- | --- |
| **مدير النظام** (ADMIN) | `admin@jobway.demo` | `admin123` | لوحة تحكم المدير — إدارة المستخدمين/الوظائف/الطلبات + إحصائيات. |
| **باحث عن عمل** (SEEKER) | `seeker@jobway.demo` | `seeker123` | لوحة الباحث — سيرة ذاتية جاهزة، طلبات، وظائف مقترحة. |
| **جهة توظيف** (COMPANY) | `company@jobway.demo` | `company123` | لوحة الجهة — نشر وظائف، إدارة المتقدمين، ملف الشركة. |

### إنشاء الحسابات يدوياً (اختياري)

```bash
# إنشاء حسابات المعاينة الثلاثة دفعة واحدة
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"action":"seed-demo"}'

# أو إنشاء حساب المدير فقط
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"action":"seed-admin"}'
```

### أدوار أخرى

- **SEEKER** (باحث عن عمل): سجّل حساباً جديداً من صفحة التسجيل.
- **COMPANY** (جهة توظيف): سجّل حساباً جديداً واختر دور الجهة.


---

## 📁 هيكل المشروع

```
.
├── prisma/
│   └── schema.prisma            # مخطط قاعدة البيانات
├── public/
│   ├── fonts/                  # خط Cairo (300–800)
│   ├── logo.svg
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── api/                # مسارات API
│   │   │   ├── auth/route.ts       # تسجيل الدخول/التسجيل
│   │   │   ├── users/route.ts     # إدارة المستخدمين + الإحصائيات
│   │   │   ├── jobs/route.ts      # إدارة الوظائف
│   │   │   ├── applications/      # طلبات التوظيف
│   │   │   ├── messages/          # الرسائل
│   │   │   ├── notifications/     # الإشعارات
│   │   │   ├── resume/            # بيانات السيرة الذاتية
│   │   │   ├── company/           # ملفات الجهات
│   │   │   └── upload/           # رفع الملفات (PDF)
│   │   ├── globals.css
│   │   ├── layout.tsx          # RTL + خط Cairo
│   │   └── page.tsx            # نقطة الدخول (SPA)
│   ├── components/
│   │   ├── ui/                 # مكوّنات shadcn/ui
│   │   └── jobway/            # مكوّنات المنصة
│   │       ├── LandingPage.tsx
│   │       ├── AuthForms.tsx
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       ├── ResumeWizard.tsx
│   │       ├── JobListings.tsx
│   │       ├── JobDetail.tsx
│   │       ├── SeekerDashboard.tsx
│   │       ├── CompanyDashboard.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── ProfilePage.tsx
│   │       ├── Messages.tsx
│   │       └── NotificationsPanel.tsx
│   ├── lib/
│   │   ├── db.ts               # عميل Prisma
│   │   ├── store.ts            # متجر Zustand
│   │   ├── types.ts            # أنواع TypeScript
│   │   └── utils.ts            # أدوات مساعدة
│   └── hooks/
│       ├── use-mobile.ts
│       └── use-toast.ts
├── .env.example
├── .gitignore
├── components.json             # إعداد shadcn/ui
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🗄️ مخطط قاعدة البيانات

| النموذج | الوصف |
| --- | --- |
| `User` | المستخدم (ADMIN / SEEKER / COMPANY) — مع علاقاته. |
| `Company` | ملف الجهة (مرتبط بـ User 1:1). |
| `Resume` | بيانات السيرة الذاتية (مرتبطة بـ User 1:1). |
| `Job` | وظيفة منشورة من جهة. |
| `Application` | طلب توظيف من باحث على وظيفة. |
| `Message` | رسالة بين مستخدمَين (قد تكون مرتبطة بطلب). |
| `Notification` | إشعار لمستخدم. |

---

## 📜 أوامر مفيدة

```bash
bun run dev         # تشغيل خادم التطوير (المنفذ 3000)
bun run build       # بناء للإنتاج
bun run start       # تشغيل خادم الإنتاج
bun run lint        # فحص جودة الكود
bun run db:push     # دفع المخطط إلى قاعدة البيانات
bun run db:generate # توليد عميل Prisma
bun run db:migrate   # إنشاء ترحيل
bun run db:reset     # إعادة تعيين قاعدة البيانات
```

---

## 🌐 النشر على Vercel / أي منصة

1. ارفع المشروع إلى مستودع GitHub.
2. اربط المستودع بـ Vercel.
3. أضف متغير البيئة `DATABASE_URL` (استخدم قاعدة بيانات Postgres/MySQL مدعومة).
4. بدّل `provider = "sqlite"` في `prisma/schema.prisma` إلى `postgresql` أو `mysql`.
5. شغّل `prisma db push` في خطوة البناء.

---

## 📝 الترخيص

هذا المشروع مُقدّم كما هو لأغراض تعليمية/تجريبية. يمكنك استخدامه وتعديله بحرية.

---

</div>

<p align="center">
  صُنع بعناية لتجربة عربية سلسة 🇸🇦
</p>
