'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Briefcase,
  Building2,
  Users,
  GraduationCap,
  ShoppingCart,
  Heart,
  Laptop,
  Palette,
  MoreHorizontal,
  UserCircle,
  ClipboardList,
  ArrowLeft,
  Star,
  ChevronLeft,
  ShieldCheck,
  Lock,
  Headphones,
  Gift,
  CheckCircle2,
  MousePointerClick,
  FileText,
  Filter,
  Bell,
  MessageSquare,
  LayoutDashboard,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Job } from '@/lib/types';
import { INTEREST_CATEGORIES, parseSkillsArray } from '@/lib/types';

/* ─── Static Maps ─── */
const categoryIcons: Record<string, React.ElementType> = {
  GraduationCap,
  ShoppingCart,
  Heart,
  Users,
  Briefcase,
  Laptop,
  Palette,
  MoreHorizontal,
};

const contractLabels: Record<string, string> = {
  permanent: 'دائم',
  temporary: 'مؤقت',
  training: 'تدريب',
};
const contractColors: Record<string, string> = {
  permanent: 'bg-emerald-100 text-emerald-700',
  temporary: 'bg-amber-100 text-amber-700',
  training: 'bg-sky-100 text-sky-700',
};

/* ─── Helpers ─── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 30) return `منذ ${days} أيام`;
  return `منذ ${Math.floor(days / 30)} شهر`;
}

/* ─── Component ─── */
export default function LandingPage() {
  const { navigate, setSearchQuery } = useAppStore();

  /* State */
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ jobs: 0, companies: 0, seekers: 0 });
  const [loading, setLoading] = useState(true);

  /* Data fetching */
  const fetchData = useCallback(async () => {
    try {
      const [jobsRes, statsRes] = await Promise.all([
        fetch('/api/jobs?status=ACTIVE'),
        fetch('/api/users?action=stats'),
      ]);

      if (!jobsRes.ok || !statsRes.ok) {
        throw new Error('فشل في تحميل البيانات');
      }

      const jobsData = await jobsRes.json();
      const statsData = await statsRes.json();

      setJobs(jobsData.jobs || []);
      setStats(statsData.stats || { jobs: 0, companies: 0, seekers: 0 });
    } catch {
      toast.error('حدث خطأ أثناء تحميل البيانات. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Silently ensure demo accounts + jobs exist so the platform looks alive
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed-demo' }),
    }).catch(() => { /* silent */ });
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed-jobs' }),
    }).catch(() => { /* silent */ });
    fetchData();
  }, [fetchData]);

  const handleSearch = () => {
    if (!search.trim()) {
      navigate('jobs');
      return;
    }
    setSearchQuery(search);
    navigate('jobs');
  };

  /* ─── Trust Badges Data ─── */
  const trustBadges = [
    { icon: ShieldCheck, label: 'منصة معتمدة' },
    { icon: Lock, label: 'بيانات محمية' },
    { icon: Headphones, label: 'دعم فني 24/7' },
    { icon: Gift, label: 'خدمة مجانية' },
    { icon: CheckCircle2, label: 'نتائج مضمونة' },
    { icon: MousePointerClick, label: 'سهولة الاستخدام' },
  ];

  /* ─── How It Works ─── */
  const steps = [
    {
      icon: UserCircle,
      title: 'سجل حسابك',
      desc: 'أنشئ حسابك مجاناً كباحث عن عمل أو كمؤسسة في دقائق معدودة عبر نموذج تسجيل مبسط.',
    },
    {
      icon: ClipboardList,
      title: 'أنشئ سيرتك الذاتية',
      desc: 'املأ بياناتك عبر معالج ذكي يُنشئ لك سيرة ذاتية احترافية تلقائياً.',
    },
    {
      icon: Briefcase,
      title: 'ابدأ التقديم',
      desc: 'تصفح الوظائف المتاحة وقدم على ما يناسب مؤهلاتك واهتماماتك بنقرة واحدة.',
    },
  ];

  /* ─── Why Choose JobWay ─── */
  const features = [
    {
      icon: UserCircle,
      title: 'سهولة التسجيل',
      desc: 'سجّل في أقل من دقيقتين مع واجهة مبسّطة وموجهة خطوة بخطوة.',
    },
    {
      icon: FileText,
      title: 'سيرة ذاتية تلقائية',
      desc: 'يُنشئ النظام سيرتك الذاتية تلقائياً بناءً على بياناتك الشخصية والمهنية.',
    },
    {
      icon: Filter,
      title: 'بحث متقدم',
      desc: 'تصفية ذكية حسب القسم والمهارات ونوع العقد للعثور على الوظيفة المثالية.',
    },
    {
      icon: Bell,
      title: 'إشعارات فورية',
      desc: 'تلقَّ إشعارات فورية عند توفر وظائف جديدة تتناسب مع ملفك الشخصي.',
    },
    {
      icon: MessageSquare,
      title: 'مراسلة مباشرة',
      desc: 'تواصل مع أصحاب العمل مباشرة عبر نظام مراسلة مدمج وآمن.',
    },
    {
      icon: LayoutDashboard,
      title: 'لوحة تحكم متكاملة',
      desc: 'تتبع طلباتك وأدر وظائفك من لوحة تحكم شاملة وسهلة الاستخدام.',
    },
  ];

  /* ─── Testimonials ─── */
  const testimonials = [
    {
      name: 'أحمد بن عمر',
      role: 'مهندس برمجيات',
      text: 'وجدت وظيفة أحلامي خلال أسبوعين فقط بفضل JobWay. المنصة سهلة الاستخدام جداً والنتائج كانت مذهلة.',
      rating: 5,
    },
    {
      name: 'سارة محمدي',
      role: 'مديرة موارد بشرية',
      text: 'كشركة، ساعدتنا المنصة في العثور على مرشحين مؤهلين بسرعة وبشكل احترافي. خدمة ممتازة!',
      rating: 5,
    },
    {
      name: 'يوسف خليفي',
      role: 'طالب جامعي',
      text: 'معالج إنشاء السيرة الذاتية رائع! أنصح به كل باحث عن عمل يريد تمييز نفسه.',
      rating: 4,
    },
  ];

  /* ─── Render ─── */
  return (
    <div className="page-transition">
      {/* ═══════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Refined gradient mesh background */}
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute inset-0 hero-aurora" />

        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `
            linear-gradient(30deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff),
            linear-gradient(150deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff),
            linear-gradient(30deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff),
            linear-gradient(150deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff),
            linear-gradient(60deg, rgba(255,255,255,0.5) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.5) 75%, rgba(255,255,255,0.5)),
            linear-gradient(60deg, rgba(255,255,255,0.5) 25%, transparent 25.5%, transparent 75%, rgba(255,255,255,0.5) 75%, rgba(255,255,255,0.5))
          `,
          backgroundSize: '80px 140px',
          backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px',
        }} />

        {/* Soft radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] translate-y-1/3" />

        {/* Content */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-36 text-center text-white">
          {/* Top label pill */}
          <div className="inline-flex items-center gap-2 glass-premium rounded-full px-5 py-2.5 mb-8 text-sm font-medium text-emerald-900 shadow-sm">
            <Briefcase className="w-4 h-4 text-emerald-700" />
            منصة التوظيف الأولى في الجزائر
          </div>

          {/* Main heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            ابحث عن وظيفة
            <br className="hidden sm:block" />
            <span className="text-emerald-200"> أحلامك مع JobWay</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-emerald-100/90 mb-12 max-w-2xl mx-auto leading-relaxed">
            منصة متكاملة تربط الباحثين عن عمل بأفضل المؤسسات والشركات.
            سجّل الآن وابدأ رحلتك المهنية بثقة.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="المسمى الوظيفي، المهارة، أو الشركة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-13 bg-white/95 backdrop-blur-sm text-gray-900 placeholder:text-slate-400 rounded-xl border-0 pr-12 pl-4 text-base shadow-xl shadow-emerald-900/20 focus:ring-2 focus:ring-emerald-300/50"
              />
            </div>
            <Button
              onClick={handleSearch}
              size="lg"
              className="h-13 px-7 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-base shadow-xl shadow-emerald-900/20 transition-all duration-200 hover:shadow-2xl"
            >
              <Search className="w-5 h-5 ml-2" />
              بحث
            </Button>
          </div>

          {/* Stats counters */}
          <div className="flex flex-wrap justify-center gap-10 sm:gap-16 md:gap-20 mt-16">
            {[
              { value: stats.jobs || stats.activeJobs || 0, label: 'وظيفة متاحة', icon: Briefcase },
              { value: stats.companies, label: 'مؤسسة مسجلة', icon: Building2 },
              { value: stats.seekers, label: 'باحث عن عمل', icon: Users },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <s.icon className="w-6 h-6 mx-auto mb-2 text-emerald-300" />
                <div className="counter-value text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                  {loading ? (
                    <Skeleton className="h-10 w-16 mx-auto bg-white/20 rounded" />
                  ) : (
                    s.value.toLocaleString('ar-DZ')
                  )}
                </div>
                <div className="text-emerald-200/80 text-sm font-medium mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#f8faf9" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. TRUST BADGES BAR
      ═══════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-emerald-50/80 to-emerald-50/30 border-y border-emerald-100/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 sm:gap-x-10">
            {trustBadges.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div
                  key={i}
                  className="trust-badge flex items-center gap-2 text-sm font-medium text-emerald-800/90"
                >
                  <span className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}>
                    <Icon className="w-3 h-3 text-emerald-700" />
                  </span>
                  <span>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. JOB CATEGORIES
      ═══════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 flex items-center justify-center gap-1">
            <span className="section-accent-bar" />
            تصفح حسب القسم
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            اختر القسم الذي يهمك واكتشف الفرص المتاحة في مجالك
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {INTEREST_CATEGORIES.map((cat, index) => {
            const Icon = categoryIcons[cat.icon] || Briefcase;
            return (
              <Card
                key={cat.id}
                className="quick-action-card border-0 stagger-item cursor-pointer group"
                style={{ animationDelay: `${index * 60}ms` }}
                onClick={() => {
                  setSearchQuery('');
                  navigate('jobs', { interest: cat.id });
                }}
              >
                <CardContent className="flex flex-col items-center justify-center py-7 text-center">
                  <div className="quick-action-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-3">
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="font-semibold text-slate-800 text-sm sm:text-base">{cat.label}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="section-divider max-w-5xl mx-auto" />

      {/* ═══════════════════════════════════════════════
          4. LATEST JOBS
      ═══════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 flex items-center gap-1">
              <span className="section-accent-bar" />
              أحدث الوظائف
            </h2>
            <p className="text-slate-500 text-sm">أحدث الفرص الوظيفية المنشورة من المؤسسات الموثوقة</p>
          </div>
          <Button
            variant="ghost"
            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-semibold hidden sm:flex"
            onClick={() => navigate('jobs')}
          >
            عرض الكل
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>

        {loading ? (
          /* Loading skeletons */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border border-slate-200/60">
                <CardContent className="p-5 space-y-4">
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-14 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full rounded" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20">
            <div className="empty-state-circle w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Briefcase className="w-9 h-9 text-emerald-600" />
            </div>
            <p className="text-slate-700 text-lg font-semibold mb-2">لا توجد وظائف متاحة حالياً</p>
            <p className="text-slate-400 text-sm">عُد إلينا لاحقاً لرؤية أحدث الفرص الوظيفية</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.slice(0, 6).map((job, index) => {
              const skills = typeof job.requiredSkills === 'string'
                ? parseSkillsArray(job.requiredSkills)
                : (job.requiredSkills || []);
              return (
                <Card
                  key={job.id}
                  className="card-premium border-0 stagger-item cursor-pointer group"
                  style={{ animationDelay: `${index * 80}ms` }}
                  onClick={() => navigate('job-detail', { id: job.id })}
                >
                  <CardContent className="p-5 flex flex-col gap-3">
                    {/* Header: position + contract badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                          {job.position}
                        </h3>
                        <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{job.companyName}</span>
                        </p>
                      </div>
                      <Badge
                        className={`flex-shrink-0 badge-premium ${contractColors[job.contractType] || 'bg-slate-100 text-slate-600'}`}
                      >
                        {contractLabels[job.contractType] || job.contractType}
                      </Badge>
                    </div>

                    {/* Skills tags */}
                    {skills && skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.slice(0, 3).map((skill: string, si: number) => (
                          <Badge
                            key={si}
                            variant="secondary"
                            className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium rounded-full px-2.5"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {skills.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-slate-100 text-slate-500 font-medium rounded-full px-2.5"
                          >
                            +{skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Footer: time, views, applicants */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-3 mt-auto border-t border-slate-100">
                      <span className="font-medium">{timeAgo(job.createdAt)}</span>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {job._count?.applications || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {job.views}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Mobile "View All" button */}
        <div className="mt-8 text-center sm:hidden">
          <Button
            variant="outline"
            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 font-semibold"
            onClick={() => navigate('jobs')}
          >
            عرض جميع الوظائف
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          5. HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <section className="bg-slate-50/60 py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">كيف يعمل JobWay؟</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              ثلاث خطوات بسيطة تفصلك عن بداية مسيرتك المهنية
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector lines (desktop only) */}
            <div className="hidden md:block absolute top-[52px] right-[33.33%] w-[33.33%] h-px bg-gradient-to-l from-emerald-300 to-emerald-200" />
            <div className="hidden md:block absolute top-[52px] left-[33.33%] w-[33.33%] h-px bg-gradient-to-l from-emerald-200 to-emerald-100" />

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="stagger-item text-center relative" style={{ animationDelay: `${i * 120}ms` }}>
                  <div className="relative inline-block mb-6">
                    {/* Icon container */}
                    <div className="w-[72px] h-[72px] rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center mx-auto">
                      <Icon className="w-9 h-9 text-emerald-600" />
                    </div>
                    {/* Step number */}
                    <div className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-emerald-600/30">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          6. WHY CHOOSE JOBWAY
      ═══════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">لماذا تختار JobWay؟</h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            منصة مصمّمة بعناية لتوفير تجربة توظيف احترافية ومتكاملة
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="stagger-item border border-slate-200/80 shadow-sm bg-white hover:border-emerald-200 transition-colors duration-200"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="section-divider max-w-5xl mx-auto" />

      {/* ═══════════════════════════════════════════════
          7. TESTIMONIALS
      ═══════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">آراء المستخدمين</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            ماذا يقول المستخدمون عن تجربتهم مع منصة JobWay
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Card
              key={i}
              className="stagger-item border border-slate-200/80 shadow-sm bg-white"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardContent className="p-6">
                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className={`w-4 h-4 ${
                        j < t.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-bold text-sm">
                      {t.name.split(' ')[0][0]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400 truncate">{t.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          8. CTA SECTION
      ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-24">
        {/* Background — premium mesh gradient */}
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute inset-0 hero-aurora" />

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[100px] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 glass-premium rounded-full px-4 py-1.5 mb-6 text-sm font-medium text-emerald-900">
            <Gift className="w-4 h-4 text-amber-600" />
            ابدأ مجاناً اليوم
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            ابدأ رحلتك المهنية الآن
          </h2>
          <p className="text-emerald-50/90 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            انضم لآلاف الباحثين عن عمل والمؤسسات على منصة JobWay
            واطلق العنان لإمكانياتك المهنية
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl px-8 py-6 font-bold text-base shadow-xl shadow-emerald-900/20 transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5"
              onClick={() => navigate('register')}
            >
              <UserCircle className="w-5 h-5 ml-2" />
              سجل كباحث عن عمل
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-xl px-8 py-6 font-bold text-base transition-all duration-200"
              onClick={() => navigate('register')}
            >
              <Building2 className="w-5 h-5 ml-2" />
              سجل كمؤسسة
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}