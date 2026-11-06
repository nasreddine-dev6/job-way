'use client';

import { useAppStore } from '@/lib/store';
import type { ViewName } from '@/lib/types';
import { Briefcase, Mail, Phone, MapPin } from 'lucide-react';

/* ─── Constants ─────────────────────────────────────────────── */

const quickLinks: { label: string; view: ViewName }[] = [
  { label: 'الرئيسية', view: 'landing' },
  { label: 'الوظائف', view: 'jobs' },
  { label: 'تسجيل الدخول', view: 'login' },
  { label: 'إنشاء حساب', view: 'register' },
  { label: 'عن المنصة', view: 'landing' },
];

const companyLinks: { label: string; guestView: ViewName; companyView: ViewName }[] = [
  { label: 'نشر وظيفة', guestView: 'register', companyView: 'company-post-job' },
  { label: 'إدارة الوظائف', guestView: 'register', companyView: 'company-manage-jobs' },
  { label: 'البحث عن مرشحين', guestView: 'register', companyView: 'company-applicants' },
  { label: 'باقات الأسعار', guestView: 'register', companyView: 'company-post-job' },
];

const socialLinks = [
  { label: 'LinkedIn', key: 'linkedin' },
  { label: 'X', key: 'x' },
  { label: 'Facebook', key: 'facebook' },
  { label: 'Instagram', key: 'instagram' },
] as const;

const legalLinks = [
  { label: 'سياسة الخصوصية' },
  { label: 'شروط الاستخدام' },
  { label: 'إعداد وتطوير' },
] as const;

/* ─── Component ─────────────────────────────────────────────── */

export default function Footer() {
  const { navigate, user } = useAppStore();

  const isCompany = user?.role === 'COMPANY';

  const handleNavigate = (view: ViewName) => {
    navigate(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto relative overflow-hidden text-white" style={{ background: 'linear-gradient(180deg, #0f1f25 0%, #14272d 100%)' }}>
      {/* Subtle top accent line */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #047857, #d97706, transparent)' }} />
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-[420px] h-[280px] bg-emerald-600/10 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[380px] h-[280px] bg-amber-600/5 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">

          {/* Column 1 — About JobWay */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden shadow-md"
                style={{ boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)' }}
              >
                <img src="/logo.png" alt="JobWay" className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-extrabold gradient-text">JobWay</span>
            </div>
            <p className="text-sm leading-7 text-slate-400">
              منصة توظيف متكاملة تهدف إلى ربط الباحثين عن عمل بأفضل الفرص
              الوظيفية المتاحة، وتسهيل عملية التوظيف للشركات والمؤسسات
              من خلال مباراة ذكية بين متطلبات الوظيفة وملفات الباحثين.
            </p>

            {/* Social Links */}
            <div className="mt-5 flex items-center gap-2">
              {socialLinks.map((social) => (
                <button
                  key={social.key}
                  className="flex h-9 items-center justify-center rounded-lg border border-slate-700/60 px-3.5 text-xs font-medium text-slate-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 transition-all duration-200"
                  aria-label={social.label}
                >
                  {social.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column 2 — روابط سريعة */}
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wide text-white flex items-center gap-1">
              <span className="section-accent-bar" />
              روابط سريعة
            </h3>
            <ul className="flex flex-col gap-0.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleNavigate(link.view)}
                    className="text-sm text-slate-400 hover:text-emerald-400 hover:translate-x-[-4px] transition-all duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — للشركات */}
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wide text-white flex items-center gap-1">
              <span className="section-accent-bar" />
              للشركات
            </h3>
            <ul className="flex flex-col gap-0.5">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleNavigate(isCompany ? link.companyView : link.guestView)}
                    className="text-sm text-slate-400 hover:text-emerald-400 hover:translate-x-[-4px] transition-all duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — تواصل معنا */}
          <div>
            <h3 className="mb-4 text-sm font-bold tracking-wide text-white flex items-center gap-1">
              <span className="section-accent-bar" />
              تواصل معنا
            </h3>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(4, 120, 87, 0.18)' }}>
                  <Mail className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-0.5">البريد الإلكتروني</p>
                  <span className="text-sm text-slate-300">info@jobway.com</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(217, 119, 6, 0.18)' }}>
                  <Phone className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-0.5">الهاتف</p>
                  <span className="text-sm text-slate-300" dir="ltr">+966 50 000 0000</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(4, 120, 87, 0.18)' }}>
                  <MapPin className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 mb-0.5">الموقع</p>
                  <span className="text-sm text-slate-300">الجزائر</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom Bar ── */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 py-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © 2025 JobWay — جميع الحقوق محفوظة
          </p>
          <div className="flex items-center gap-4">
            {legalLinks.map((link) => (
              <button
                key={link.label}
                className="text-xs text-slate-500 hover:text-emerald-400 transition-colors duration-200"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}