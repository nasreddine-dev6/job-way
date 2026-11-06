'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight,
  Building2,
  MapPin,
  Clock,
  Users,
  Eye,
  Briefcase,
  Share2,
  BookmarkPlus,
  CheckCircle2,
  FileText,
  DollarSign,
  CalendarDays,
  GraduationCap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { SKILLS_LIST } from '@/lib/types';
import { toast } from 'sonner';

// Label maps
const contractTypeLabels: Record<string, string> = {
  permanent: '\u062F\u0627\u0626\u0645',
  temporary: '\u0645\u0624\u0642\u062A',
  training: '\u062A\u062F\u0631\u064A\u0628',
};

const contractTypeColors: Record<string, string> = {
  permanent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  temporary: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  training: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
};

const workerStyleLabels: Record<string, string> = {
  disciplined: '\u0645\u0646\u0636\u0628\u0637',
  independent: '\u0645\u0633\u062A\u0642\u0644',
  social: '\u0627\u062C\u062A\u0645\u0627\u0639\u064A',
};

const workerStyleColors: Record<string, string> = {
  disciplined: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  independent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
};

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: '\u0642\u064A\u062F \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  ACTIVE: {
    label: '\u0646\u0634\u0637\u0629',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  CLOSED: {
    label: '\u0645\u063A\u0644\u0642\u0629',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  },
};

const skillPalette = [
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
];

function getSkillColor(i: number) {
  return skillPalette[i % skillPalette.length];
}

// Skeleton loader
function JobDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      <Skeleton className="h-10 w-28 rounded-lg" />
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-9 w-3/5" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-36" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-28 rounded-full" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Info row helper
function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );
}

// Similar job mini-card
interface SimpleJob {
  id: string;
  position: string;
  companyName: string;
  contractType: string;
  activityType: string;
  createdAt: string;
  views: number;
  _count?: { applications: number };
}

function SimilarJobCard({ job, onNavigate }: { job: SimpleJob; onNavigate: (id: string) => void }) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200"
      onClick={() => onNavigate(job.id)}
    >
      <CardContent className="p-4 space-y-3">
        <h4 className="font-semibold text-sm text-foreground leading-snug line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {job.position}
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{job.companyName}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className={`text-[11px] px-2 py-0 ${contractTypeColors[job.contractType] || ''}`}
          >
            {contractTypeLabels[job.contractType] || job.contractType}
          </Badge>
          <Badge variant="secondary" className="text-[11px] px-2 py-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {job.activityType}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// Job data from API (requiredSkills comes as JSON string)
interface JobData {
  id: string;
  companyId: string;
  companyName: string;
  activityType: string;
  position: string;
  requiredSkills: string;
  workerStyle: string;
  contractType: string;
  budget?: string | null;
  description?: string | null;
  requirements?: string | null;
  status: string;
  views: number;
  createdAt: string;
  _count?: { applications: number };
  company?: {
    id: string;
    name: string;
    activityType: string;
    description?: string;
    website?: string;
    logo?: string;
  };
  applications?: { seekerId: string }[];
}

// Main component
export default function JobDetail() {
  const { viewParams, user, navigate } = useAppStore();
  const [job, setJob] = useState<JobData | null>(null);
  const [similarJobs, setSimilarJobs] = useState<SimpleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Fetch job on mount
  useEffect(() => {
    async function fetchJob() {
      const jobId = viewParams.id;
      if (!jobId) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/jobs?id=${jobId}`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const fetchedJob: JobData = data.job || data;
        setJob(fetchedJob);

        // Check if current user already applied
        if (user?.role === 'SEEKER' && fetchedJob.applications) {
          const alreadyApplied = fetchedJob.applications.some(
            (app: { seekerId: string }) => app.seekerId === user.id
          );
          if (alreadyApplied) setHasApplied(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchJob();
  }, [viewParams.id, user]);

  // Fetch similar jobs
  useEffect(() => {
    async function fetchSimilar() {
      if (!job) return;
      try {
        const res = await fetch('/api/jobs?status=ACTIVE');
        if (!res.ok) return;
        const data = await res.json();
        const all: SimpleJob[] = data.jobs || [];
        setSimilarJobs(all.filter((j) => j.id !== job.id).slice(0, 3));
      } catch {
        // ignore
      }
    }
    fetchSimilar();
  }, [job]);

  // Parse required skills from JSON string
  const parsedSkills: string[] = (() => {
    if (!job?.requiredSkills) return [];
    try {
      const p = JSON.parse(job.requiredSkills);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  })();

  // Format date
  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  // Handle apply
  async function handleApply() {
    if (!job || !user || user.role !== 'SEEKER') return;
    setApplying(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, seekerId: user.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'فشل في التقديم');
      }
      toast.success('تم التقديم بنجاح!');
      setHasApplied(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ أثناء التقديم';
      toast.error(message);
    } finally {
      setApplying(false);
    }
  }

  // Handle share
  function handleShare() {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => toast.success('تم نسخ رابط الوظيفة'))
        .catch(() => toast.error('تعذر نسخ الرابط'));
    } else {
      toast.error('النسخ غير مدعوم في هذا المتصفح');
    }
  }

  // Navigate to similar job
  function goToSimilarJob(id: string) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setJob(null);
    setSimilarJobs([]);
    setHasApplied(false);
    setNotFound(false);
    setLoading(true);
    navigate('job-detail', { id });
  }

  // Loading state
  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background">
        <JobDetailSkeleton />
      </div>
    );
  }

  // Not found state
  if (notFound || !job) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardContent className="p-8 space-y-5">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FileText className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">لم يتم العثور على الوظيفة</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              الوظيفة التي تبحث عنها غير موجودة أو قد تم حذفها.
            </p>
            <Button variant="outline" onClick={() => navigate('jobs')} className="gap-2">
              <ArrowRight className="w-4 h-4" />
              العودة للوظائف
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[job.status] || statusConfig.PENDING;
  const applicationCount = job._count?.applications ?? 0;

  // Main content
  return (
    <div dir="rtl" className="min-h-screen bg-background pb-32 sm:pb-8">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">

        {/* Back Button */}
        <button
          onClick={() => navigate('jobs')}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-2 py-1 px-2 rounded-lg hover:bg-muted/50"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة</span>
        </button>

        {/* Main Job Header Card */}
        <Card className="overflow-hidden border-t-2 border-t-emerald-600 shadow-lg">
          <CardContent className="p-5 sm:p-6 space-y-5">

            {/* Title + Share */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  {job.position}
                </h1>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {job.company?.name || job.companyName}
                  </span>
                  {job.activityType && (
                    <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {job.activityType}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                  aria-label="حفظ الوظيفة"
                  onClick={() => toast.info('تم حفظ الوظيفة في المفضلة')}
                >
                  <BookmarkPlus className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
                  aria-label="مشاركة الوظيفة"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Meta badges row */}
            <div className="flex flex-wrap items-center gap-2.5 text-sm">
              <Badge variant="secondary" className={`font-medium ${status.color}`}>
                {status.label}
              </Badge>
              <Badge variant="secondary" className={contractTypeColors[job.contractType] || ''}>
                <Briefcase className="w-3.5 h-3.5 ml-1" />
                {contractTypeLabels[job.contractType] || job.contractType}
              </Badge>
              <Badge variant="secondary" className={workerStyleColors[job.workerStyle] || ''}>
                <Users className="w-3.5 h-3.5 ml-1" />
                {workerStyleLabels[job.workerStyle] || job.workerStyle}
              </Badge>

              <Separator orientation="vertical" className="h-5 hidden sm:block" />

              {job.budget && (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <DollarSign className="w-4 h-4" />
                  {job.budget}
                </span>
              )}

              <Separator orientation="vertical" className="h-5 hidden sm:block" />

              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Eye className="w-4 h-4" />
                {job.views} مشاهدة
              </span>

              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-4 h-4" />
                {applicationCount} متقدم
              </span>

              <Separator orientation="vertical" className="h-5 hidden sm:block" />

              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="w-4 h-4" />
                {formatDate(job.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Job Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <span>تفاصيل الوظيفة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              <InfoRow icon={Building2} label="نوع النشاط">
                <span>{job.activityType}</span>
              </InfoRow>
              <InfoRow icon={Briefcase} label="نوع العقد">
                <Badge variant="secondary" className={contractTypeColors[job.contractType] || ''}>
                  {contractTypeLabels[job.contractType] || job.contractType}
                </Badge>
              </InfoRow>
              <InfoRow icon={Users} label="نمط العامل">
                <Badge variant="secondary" className={workerStyleColors[job.workerStyle] || ''}>
                  {workerStyleLabels[job.workerStyle] || job.workerStyle}
                </Badge>
              </InfoRow>
              {job.budget && (
                <InfoRow icon={DollarSign} label="الميزانية">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{job.budget}</span>
                </InfoRow>
              )}
              <InfoRow icon={Eye} label="عدد المشاهدات">
                <span>{job.views}</span>
              </InfoRow>
              <InfoRow icon={Users} label="عدد المتقدمين">
                <span>{applicationCount}</span>
              </InfoRow>
            </div>
          </CardContent>
        </Card>

        {/* Required Skills */}
        {parsedSkills.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span>المهارات المطلوبة</span>
                <Badge
                  variant="secondary"
                  className="text-xs font-normal mr-auto bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                >
                  {parsedSkills.length} مهارة
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2.5">
                {parsedSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className={`${getSkillColor(index)} px-3.5 py-1.5 text-sm font-medium`}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {job.description && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>وصف الوظيفة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Requirements */}
        {job.requirements && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>المتطلبات</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {job.requirements.split('\n').filter((l) => l.trim()).map((line, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                    </span>
                    <span>{line.replace(/^[-*\u2022\d.)\s]+/, '')}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Similar Jobs */}
        {similarJobs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <span>وظائف مشابهة</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {similarJobs.map((sj) => (
                <SimilarJobCard key={sj.id} job={sj} onNavigate={goToSimilarJob} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Apply Bar */}
      <div className="fixed bottom-0 inset-x-0 sm:static sm:bottom-auto sm:inset-auto bg-background/95 backdrop-blur-sm border-t sm:border-0 p-4 sm:p-0 sm:pt-2 sm:max-w-4xl sm:mx-auto sm:px-4 sm:px-6 z-30">
        {!user && (
          <Button
            className="w-full h-12 text-base font-semibold rounded-xl gap-2 border-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            variant="ghost"
            onClick={() => navigate('login')}
          >
            <span>سجل دخولك لتقديم</span>
          </Button>
        )}

        {user?.role === 'SEEKER' && !hasApplied && (
          <Button
            className="w-full h-12 text-base font-semibold rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
            onClick={handleApply}
            disabled={applying || job.status === 'CLOSED'}
          >
            {applying ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري التقديم...</span>
              </span>
            ) : job.status === 'CLOSED' ? (
              <span>هذه الوظيفة مغلقة</span>
            ) : (
              <span>قدم على هذه الوظيفة</span>
            )}
          </Button>
        )}

        {user?.role === 'SEEKER' && hasApplied && (
          <Button
            disabled
            className="w-full h-12 text-base font-semibold rounded-xl gap-2 cursor-not-allowed bg-muted text-muted-foreground"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span>لقد تقدمت بالفعل</span>
          </Button>
        )}

        {(user?.role === 'COMPANY' || user?.role === 'ADMIN') && (
          <div className="w-full flex items-center justify-center h-12 text-sm text-muted-foreground bg-muted/50 rounded-xl">
            <span>هذا القسم متاح للباحثين عن عمل فقط</span>
          </div>
        )}
      </div>
    </div>
  );
}