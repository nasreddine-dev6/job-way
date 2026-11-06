'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Plus,
  User,
  ChevronLeft,
  Search,
  MapPin,
  Send,
  TrendingUp,
  Target,
  Award,
  Building2,
} from 'lucide-react';
import type { Application, Resume, Job } from '@/lib/types';
import { parseSkillsArray, normalizeResume } from '@/lib/types';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700', icon: Clock },
  ACCEPTED: { label: 'مقبول', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const contractLabels: Record<string, string> = {
  permanent: 'دائم',
  temporary: 'مؤقت',
  training: 'تدريب',
};

const interestLabels: Record<string, string> = {
  education: 'التعليم',
  commerce: 'التجارة',
  health: 'الصحة',
  services: 'الخدمات',
  management: 'الإدارة',
  technology: 'التقنية',
  creativity: 'الإبداع',
  other: 'أخرى',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 30) return `منذ ${days} أيام`;
  return `منذ ${Math.floor(days / 30)} شهر`;
}

function formatDateArabic(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Resume Completion Calculator                                       */
/* ------------------------------------------------------------------ */

function getResumeCompletion(resume: Resume): number {
  if (!resume) return 0;
  const fields = [
    resume.fullName,
    resume.education,
    resume.skills?.length > 0,
    resume.age > 0,
    resume.professionalInterest,
    resume.workSystem,
    resume.resumeFile,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/* ------------------------------------------------------------------ */
/*  Skeleton Loaders                                                   */
/* ------------------------------------------------------------------ */

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm bg-white">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-20" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ApplicationsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border-0">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-10" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm bg-white">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full shrink-0" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SuggestedJobsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm bg-white">
          <CardContent className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Star Rating                                                        */
/* ------------------------------------------------------------------ */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
          />
        </svg>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function SeekerDashboard() {
  const { user, navigate, currentView } = useAppStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState<Application[]>([]);
  const [resume, setResume] = useState<Resume | null>(null);
  const [suggestedJobs, setSuggestedJobs] = useState<Job[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  /* ---- Sync tab with currentView ---- */
  useEffect(() => {
    if (currentView === 'seeker-applications') {
      setActiveTab('applications');
    }
  }, [currentView]);

  /* ---- Fetch overview data ---- */
  const fetchOverviewData = useCallback(async () => {
    if (!user) return;
    setLoadingOverview(true);
    try {
      const [appsRes, resumeRes] = await Promise.all([
        fetch(`/api/applications?seekerId=${user.id}`),
        fetch(`/api/resume?userId=${user.id}`),
      ]);

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData.applications || []);
      } else {
        toast.error('فشل تحميل الطلبات');
      }

      if (resumeRes.ok) {
        const resumeData = await resumeRes.json();
        setResume(normalizeResume(resumeData.resume));
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoadingOverview(false);
    }
  }, [user]);

  /* ---- Fetch all applications (tab 2) ---- */
  const fetchApplications = useCallback(async () => {
    if (!user) return;
    setLoadingApplications(true);
    try {
      const res = await fetch(`/api/applications?seekerId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      } else {
        toast.error('فشل تحميل الطلبات');
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setLoadingApplications(false);
    }
  }, [user]);

  /* ---- Fetch suggested jobs ---- */
  const fetchSuggestedJobs = useCallback(async () => {
    if (!user) return;
    setLoadingSuggested(true);
    try {
      const [jobsRes, appsRes] = await Promise.all([
        fetch('/api/jobs?status=ACTIVE'),
        fetch(`/api/applications?seekerId=${user.id}`),
      ]);

      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setSuggestedJobs((jobsData.jobs || []).slice(0, 4));
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        const ids = new Set((appsData.applications || []).map((a: Application) => a.jobId));
        setAppliedJobIds(ids);
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل الوظائف المقترحة');
    } finally {
      setLoadingSuggested(false);
    }
  }, [user]);

  /* ---- Initial load ---- */
  useEffect(() => {
    fetchOverviewData();
    fetchSuggestedJobs();
  }, [fetchOverviewData, fetchSuggestedJobs]);

  /* ---- Tab change handler ---- */
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'applications') {
      fetchApplications();
    } else if (value === 'suggested') {
      fetchSuggestedJobs();
    }
  };

  /* ---- Apply to job ---- */
  const handleApply = async (jobId: string) => {
    if (!user) return;
    setApplyingJobId(jobId);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, seekerId: user.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل في التقديم');
      }

      toast.success('تم التقديم بنجاح!');
      setAppliedJobIds((prev) => new Set(prev).add(jobId));
      fetchOverviewData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء التقديم';
      toast.error(message);
    } finally {
      setApplyingJobId(null);
    }
  };

  /* ---- Computed stats ---- */
  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
  const acceptedCount = applications.filter((a) => a.status === 'ACCEPTED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;
  const totalCount = applications.length;

  const recentApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [applications],
  );

  const resumeCompletion = useMemo(() => getResumeCompletion(resume), [resume]);

  /* ---- Stat cards data ---- */
  const statCards = [
    {
      label: 'إجمالي الطلبات',
      value: totalCount,
      icon: Briefcase,
      iconClass: 'stat-icon-emerald',
      trend: totalCount > 0 ? `${totalCount}` : '0',
      trendDir: 'neutral' as const,
    },
    {
      label: 'قيد المراجعة',
      value: pendingCount,
      icon: Clock,
      iconClass: 'stat-icon-amber',
      trend: pendingCount > 0 ? `${pendingCount}` : '0',
      trendDir: 'neutral' as const,
    },
    {
      label: 'مقبول',
      icon: CheckCircle2,
      iconClass: 'stat-icon-emerald',
      value: acceptedCount,
      trend: totalCount > 0 ? `${Math.round((acceptedCount / totalCount) * 100)}%` : '0%',
      trendDir: 'up' as const,
    },
    {
      label: 'مرفوض',
      value: rejectedCount,
      icon: XCircle,
      iconClass: 'stat-icon-rose',
      trend: totalCount > 0 ? `${Math.round((rejectedCount / totalCount) * 100)}%` : '0%',
      trendDir: 'down' as const,
    },
  ];

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div dir="rtl" className="page-transition min-h-screen bg-slate-50/80">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">

        {/* ── Welcome Banner ── */}
        <div className="relative overflow-hidden rounded-2xl mb-8" style={{ boxShadow: '0 4px 14px rgba(4, 120, 87, 0.18), 0 2px 6px rgba(4, 120, 87, 0.08)' }}>
          {/* Mesh gradient + aurora overlay */}
          <div className="absolute inset-0 gradient-mesh" />
          <div className="absolute inset-0 hero-aurora" />
          {/* Subtle dotted pattern */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }} />
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full translate-x-1/4 translate-y-1/4" />

          <div className="relative p-6 sm:p-8 text-white">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-white/30 shadow-lg ring-2 ring-white/10">
                <AvatarFallback className="bg-white/20 text-white text-xl sm:text-2xl font-bold backdrop-blur-sm">
                  {user?.name?.charAt(0) || 'م'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-premium bg-white/15 text-white border-white/20 backdrop-blur-sm">
                    <Award className="w-3 h-3" />
                    باحث عن عمل
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  مرحباً {user?.name || 'باحث عن عمل'}
                </h1>
                <p className="text-emerald-100/90 text-sm sm:text-base mt-1">
                  تابع حالة طلباتك واكتشف فرص عمل جديدة مناسبة لك
                </p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1.5 text-emerald-100/70 text-xs">
                  <Award className="w-3.5 h-3.5" />
                  <span>لوحة التحكم</span>
                </div>
                <span className="text-white/50 text-xs font-light">
                  {formatDateArabic(new Date().toISOString())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-white shadow-sm border w-full sm:w-auto h-auto p-1 grid grid-cols-3 sm:inline-flex" style={{ boxShadow: '0 1px 2px rgba(20, 39, 45, 0.04), 0 4px 12px rgba(20, 39, 45, 0.05)' }}>
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-sm py-2.5"
            >
              <TrendingUp className="w-4 h-4 ml-1.5 inline-block" />
              نظرة عامة
            </TabsTrigger>
            <TabsTrigger
              value="applications"
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-sm py-2.5"
            >
              <FileText className="w-4 h-4 ml-1.5 inline-block" />
              طلباتي
            </TabsTrigger>
            <TabsTrigger
              value="suggested"
              className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white text-sm py-2.5"
            >
              <Search className="w-4 h-4 ml-1.5 inline-block" />
              مقترحة
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/*  TAB 1: Overview                                              */}
          {/* ============================================================ */}
          <TabsContent value="overview">
            {loadingOverview ? (
              <OverviewSkeleton />
            ) : (
              <div className="space-y-6">

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {statCards.map((stat) => {
                    const StatIcon = stat.icon;
                    return (
                      <Card
                        key={stat.label}
                        className="stat-card-pro border-0"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.iconClass}`}>
                              <StatIcon className="w-5 h-5" />
                            </div>
                            {stat.trend && (
                              <span className={stat.trendDir === 'up' ? 'trend-up' : stat.trendDir === 'down' ? 'trend-down' : 'trend-neutral'}>
                                <TrendingUp className={`w-3 h-3 ${stat.trendDir === 'down' ? 'rotate-180' : ''}`} />
                                {stat.trend}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
                          <div className="premium-number text-3xl sm:text-4xl font-extrabold text-gray-900 leading-none">
                            {stat.value}
                          </div>
                          {stat.label === 'مقبول' && totalCount > 0 && (
                            <p className="text-xs text-gray-400 mt-2">
                              نسبة القبول {Math.round((acceptedCount / totalCount) * 100)}%
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* ── Resume Status Card ── */}
                <Card className="card-premium border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                      <span className="section-accent-bar" />
                      <div className="p-2 rounded-lg bg-emerald-50">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      السيرة الذاتية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {resume ? (
                      <div className="space-y-4">
                        {/* User info row */}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 ring-2 ring-emerald-100">
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-sm">
                              {resume.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-gray-900 truncate">
                              {resume.fullName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                              <GraduationCapIcon />
                              {resume.education}
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-xs border-0 shrink-0 ${
                              resumeCompletion >= 80
                                ? 'bg-emerald-100 text-emerald-700'
                                : resumeCompletion >= 50
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {resumeCompletion}%
                          </Badge>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 font-medium">مستوى اكتمال الملف</span>
                            <span className="font-semibold text-gray-700">{resumeCompletion}%</span>
                          </div>
                          <Progress value={resumeCompletion} className="h-2.5" />
                          <p className="text-xs text-gray-400">
                            {resumeCompletion >= 80
                              ? 'ملفك شبه مكتمل، أضف بعض التفاصيل الإضافية لتحسين فرصك'
                              : resumeCompletion >= 50
                                ? 'ملفك بحاجة لمزيد من التفاصيل لجذب أصحاب العمل'
                                : 'أكمل ملفك لزيادة فرصك في الحصول على وظيفة'}
                          </p>
                        </div>

                        {/* Skills tags */}
                        {resume.skills && resume.skills.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-2">
                              <Target className="w-3.5 h-3.5" />
                              المهارات
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {resume.skills.map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="bg-emerald-50 text-emerald-700 text-xs border-0 hover:bg-emerald-100"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="w-4 h-4 text-gray-400" />
                              {resume.currentlyWorking ? 'يعمل حالياً' : 'غير عامل'}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <User className="w-4 h-4 text-gray-400" />
                              {interestLabels[resume.professionalInterest] || resume.professionalInterest}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            className="gap-2 flex-1 sm:flex-none"
                            onClick={() => navigate('seeker-resume')}
                          >
                            <Eye className="w-4 h-4" />
                            عرض السيرة الذاتية
                          </Button>
                          <Button
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
                            onClick={() => navigate('seeker-resume')}
                          >
                            <Edit className="w-4 h-4" />
                            تعديل
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-4">
                        <div className="empty-state-circle w-20 h-20 rounded-2xl flex items-center justify-center mx-auto">
                          <FileText className="w-9 h-9 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-gray-700 font-semibold text-lg mb-1">لم تنشئ سيرتك الذاتية بعد</p>
                          <p className="text-gray-400 text-sm">
                            أنشئ سيرتك الذاتية الآن لتتمكن من التقديم على الوظائف
                          </p>
                        </div>
                        <Button
                          className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                          style={{ boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)' }}
                          onClick={() => navigate('seeker-resume')}
                        >
                          <Plus className="w-4 h-4" />
                          إنشاء سيرة ذاتية
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── Recent Applications ── */}
                <Card className="card-premium border-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                        <span className="section-accent-bar" />
                        <div className="p-2 rounded-lg bg-emerald-50">
                          <Clock className="w-5 h-5 text-emerald-600" />
                        </div>
                        أحدث الطلبات
                      </CardTitle>
                      {applications.length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                          onClick={() => setActiveTab('applications')}
                        >
                          عرض الكل
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentApplications.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="empty-state-circle w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Briefcase className="w-7 h-7 text-emerald-500" />
                        </div>
                        <p className="text-gray-700 font-semibold mb-1">لا توجد طلبات بعد</p>
                        <p className="text-gray-400 text-sm">
                          ابدأ بالتقديم على الوظائف المقترحة أدناه
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                        {recentApplications.map((app) => {
                          const status = statusConfig[app.status];
                          const StatusIcon = status?.icon || Clock;
                          return (
                            <div
                              key={app.id}
                              className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
                              onClick={() =>
                                navigate('job-detail', { id: app.jobId })
                              }
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                                  {app.job?.position || 'وظيفة محذوفة'}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5 truncate flex items-center gap-1.5">
                                  <Building2 className="w-3 h-3 shrink-0" />
                                  {app.job?.companyName || '—'}
                                  <span className="text-gray-300">·</span>
                                  {timeAgo(app.createdAt)}
                                </div>
                              </div>
                              <Badge
                                variant="secondary"
                                className={`shrink-0 mr-3 text-xs border-0 ${status?.color || ''}`}
                              >
                                <StatusIcon className="w-3 h-3 ml-1" />
                                {status?.label || app.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ── Suggested Jobs Preview ── */}
                <Card className="card-premium border-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                        <span className="section-accent-bar" />
                        <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)' }}>
                          <Search className="w-5 h-5" style={{ color: '#b45309' }} />
                        </div>
                        وظائف مقترحة لك
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                        onClick={() => {
                          setActiveTab('suggested');
                          fetchSuggestedJobs();
                        }}
                      >
                        عرض المزيد
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SuggestedJobsInline
                      jobs={suggestedJobs}
                      appliedJobIds={appliedJobIds}
                      applyingJobId={applyingJobId}
                      onApply={handleApply}
                      onNavigate={navigate}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ============================================================ */}
          {/*  TAB 2: My Applications                                      */}
          {/* ============================================================ */}
          <TabsContent value="applications">
            {loadingApplications ? (
              <ApplicationsSkeleton />
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="empty-state-circle w-20 h-20 rounded-2xl flex items-center justify-center mb-5">
                  <Send className="w-9 h-9 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">لا توجد طلبات</h3>
                <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                  لم تقدم على أي وظيفة بعد. ابدأ بتصفح الوظائف المتاحة وقدّم على ما يناسبك!
                </p>
                <Button
                  className="mt-5 gap-2 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  style={{ boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)' }}
                  onClick={() => setActiveTab('overview')}
                >
                  <Briefcase className="w-4 h-4" />
                  تصفح الوظائف المقترحة
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Acceptance rate bar */}
                <Card className="card-premium border-0">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-gray-600 font-medium flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-emerald-600" />
                        نسبة القبول
                      </span>
                      <span className="font-bold text-emerald-600 text-base">
                        {totalCount > 0
                          ? Math.round((acceptedCount / totalCount) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <Progress
                      value={totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0}
                      className="h-2.5"
                    />
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>{acceptedCount} مقبول من {totalCount}</span>
                      <span>{pendingCount} قيد المراجعة</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Application cards */}
                {applications.map((app) => {
                  const status = statusConfig[app.status];
                  const StatusIcon = status?.icon || Clock;
                  return (
                    <Card
                      key={app.id}
                      className="card-premium border-0"
                    >
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3
                              className="font-bold text-gray-900 text-base truncate cursor-pointer hover:text-emerald-700 transition-colors"
                              onClick={() =>
                                navigate('job-detail', { id: app.jobId })
                              }
                            >
                              {app.job?.position || 'وظيفة محذوفة'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                              {app.job?.companyName || '—'}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`shrink-0 text-xs border-0 badge-premium ${status?.color || ''}`}
                          >
                            <StatusIcon className="w-3 h-3 ml-1" />
                            {status?.label || app.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {timeAgo(app.createdAt)}
                            </span>
                            {app.rating != null && app.rating > 0 && (
                              <div className="flex items-center gap-1">
                                <StarRating rating={app.rating} />
                                <span className="mr-1 text-gray-500 font-medium">
                                  {app.rating}/5
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                            onClick={() =>
                              navigate('job-detail', { id: app.jobId })
                            }
                          >
                            <Eye className="w-3.5 h-3.5" />
                            عرض التفاصيل
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ============================================================ */}
          {/*  TAB 3: Suggested Jobs (hidden tab, triggered from overview)  */}
          {/* ============================================================ */}
          <TabsContent value="suggested">
            {loadingSuggested ? (
              <SuggestedJobsSkeleton />
            ) : suggestedJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="empty-state-circle w-20 h-20 rounded-2xl flex items-center justify-center mb-5">
                  <Search className="w-9 h-9 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">
                  لا توجد وظائف متاحة حالياً
                </h3>
                <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                  تحقق لاحقاً للاطلاع على فرص عمل جديدة تتناسب مع مهاراتك
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {suggestedJobs.map((job) => (
                  <SuggestedJobCard
                    key={job.id}
                    job={job}
                    hasApplied={appliedJobIds.has(job.id)}
                    isApplying={applyingJobId === job.id}
                    onApply={handleApply}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

/** Inline suggested jobs for the overview tab */
function SuggestedJobsInline({
  jobs,
  appliedJobIds,
  applyingJobId,
  onApply,
  onNavigate,
}: {
  jobs: Job[];
  appliedJobIds: Set<string>;
  applyingJobId: string | null;
  onApply: (jobId: string) => void;
  onNavigate: (view: string, params?: Record<string, string>) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="empty-state-circle w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Briefcase className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="text-gray-600 text-sm font-medium">لا توجد وظائف مقترحة حالياً</p>
        <p className="text-gray-400 text-xs mt-1">تحقق لاحقاً للاطلاع على فرص جديدة</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {jobs.slice(0, 4).map((job) => (
        <SuggestedJobCard
          key={job.id}
          job={job}
          hasApplied={appliedJobIds.has(job.id)}
          isApplying={applyingJobId === job.id}
          onApply={onApply}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

/** Individual suggested job card */
function SuggestedJobCard({
  job,
  hasApplied,
  isApplying,
  onApply,
  onNavigate,
}: {
  job: Job;
  hasApplied: boolean;
  isApplying: boolean;
  onApply: (jobId: string) => void;
  onNavigate: (view: string, params?: Record<string, string>) => void;
}) {
  const skills = parseSkillsArray(job.requiredSkills);
  return (
    <div className="quick-action-card border-0 p-5" style={{ cursor: 'default' }}>
      {/* Position & Company */}
      <div className="mb-3">
        <h3
          className="font-bold text-gray-900 cursor-pointer hover:text-emerald-700 transition-colors leading-relaxed text-base"
          onClick={() => onNavigate('job-detail', { id: job.id })}
        >
          {job.position}
        </h3>
        <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
          <Building2 className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span className="truncate">{job.companyName}</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="badge-premium bg-gray-100 text-gray-600">{job.activityType}</span>
        <span className="badge-premium" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309' }}>
          {contractLabels[job.contractType] || job.contractType}
        </span>
      </div>

      {/* Budget */}
      {job.budget && (
        <div className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5 p-2 rounded-lg" style={{ background: 'rgba(254, 243, 199, 0.4)' }}>
          <TrendingUp className="w-3.5 h-3.5" style={{ color: '#b45309' }} />
          {job.budget}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="inline-block bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-100/60"
            >
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="inline-block bg-gray-100 text-gray-500 text-xs px-2.5 py-0.5 rounded-full">
              +{skills.length - 3} أخرى
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{timeAgo(job.createdAt)}</span>
        {hasApplied ? (
          <Button
            disabled
            size="sm"
            className="text-xs gap-1.5 cursor-not-allowed bg-emerald-50 text-emerald-600 border-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            تم التقديم
          </Button>
        ) : (
          <Button
            size="sm"
            className="text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
            style={{ boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)' }}
            disabled={isApplying}
            onClick={() => onApply(job.id)}
          >
            {isApplying ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري التقديم...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                قدم الآن
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/** Simple inline graduation cap icon (SVG) to avoid importing from lucide */
function GraduationCapIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
    </svg>
  );
}