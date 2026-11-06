'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Briefcase, Plus, Users, Eye, Edit, Trash2, CheckCircle2, XCircle,
  Clock, Star, ChevronLeft, Building2, Search, BarChart3, Send,
  MessageSquare, Filter, FileText, DollarSign, TrendingUp,
} from 'lucide-react';
import type { Job, Application } from '@/lib/types';
import { SKILLS_LIST, ACTIVITY_TYPES } from '@/lib/types';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: { label: 'قيد المراجعة', color: 'bg-amber-100 text-amber-700', icon: Clock },
  ACCEPTED: { label: 'مقبول', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: XCircle },
  ACTIVE: { label: 'نشطة', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  CLOSED: { label: 'مغلقة', color: 'bg-slate-100 text-slate-600', icon: XCircle },
};

const contractLabels: Record<string, string> = { permanent: 'دائم', temporary: 'مؤقت', training: 'تدريب' };
const workerLabels: Record<string, string> = { disciplined: 'منضبط', independent: 'مستقل', social: 'اجتماعي' };

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 30) return `منذ ${days} أيام`;
  return `منذ ${Math.floor(days / 30)} شهر`;
}

function parseSkills(skills: unknown): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills as string[];
  if (typeof skills === 'string') {
    try { return JSON.parse(skills); } catch { return skills.split(',').map(s => s.trim()).filter(Boolean); }
  }
  return [];
}

export default function CompanyDashboard() {
  const { user, currentView, viewParams, navigate } = useAppStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [ratingMap, setRatingMap] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  // Job form state
  const [formPos, setFormPos] = useState('');
  const [formActivity, setFormActivity] = useState('');
  const [formSkills, setFormSkills] = useState<string[]>([]);
  const [formWorker, setFormWorker] = useState('disciplined');
  const [formContract, setFormContract] = useState('permanent');
  const [formBudget, setFormBudget] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formReq, setFormReq] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const companyId = user?.company?.id || '';
  const companyName = user?.company?.name || user?.name || '';

  const fetchJobs = useCallback(async () => {
    if (!companyId) { setJobs([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?companyId=${companyId}&status=ALL`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      } else { setJobs([]); }
    } catch { setJobs([]); toast.error('حدث خطأ أثناء تحميل الوظائف'); }
    finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Load applicants for selected job
  const loadApplicants = async (job: Job) => {
    setSelectedJob(job);
    try {
      const res = await fetch(`/api/jobs?id=${job.id}`);
      if (res.ok) {
        const data = await res.json();
        const apps = data.job?.applications || [];
        setApplicants(apps);
        const nm: Record<string, string> = {};
        const rm: Record<string, number> = {};
        apps.forEach((a: Application) => { nm[a.id] = a.notes || ''; rm[a.id] = a.rating || 0; });
        setNotesMap(nm);
        setRatingMap(rm);
      }
    } catch { setApplicants([]); }
  };

  const resetForm = () => {
    setFormPos(''); setFormActivity(''); setFormSkills([]);
    setFormWorker('disciplined'); setFormContract('permanent');
    setFormBudget(''); setFormDesc(''); setFormReq('');
    setEditingJobId(null);
  };

  const startEdit = (job: Job) => {
    setEditingJobId(job.id);
    setFormPos(job.position);
    setFormActivity(job.activityType);
    setFormSkills(parseSkills(job.requiredSkills));
    setFormWorker(job.workerStyle);
    setFormContract(job.contractType);
    setFormBudget(job.budget || '');
    setFormDesc(job.description || '');
    setFormReq(job.requirements || '');
    // Go to the form view so the user can actually see and submit the edit
    navigate('company-post-job');
  };

  const handleSubmitJob = async () => {
    if (!formPos.trim() || !formActivity) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }
    if (!companyId) {
      toast.error('لم يتم العثور على ملف المؤسسة، يرجى تحديث الصفحة أو إعادة تسجيل الدخول');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        companyId,
        companyName,
        activityType: formActivity,
        position: formPos,
        requiredSkills: formSkills,
        workerStyle: formWorker,
        contractType: formContract,
        budget: formBudget || null,
        description: formDesc,
        requirements: formReq,
        status: editingJobId
          ? (jobs.find(j => j.id === editingJobId)?.status || 'PENDING')
          : 'PENDING',
      };

      if (editingJobId) {
        body.id = editingJobId;
        const res = await fetch('/api/jobs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) toast.success('تم تحديث الوظيفة بنجاح');
        else toast.error('فشل تحديث الوظيفة');
      } else {
        const res = await fetch('/api/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (res.ok) toast.success('تم نشر الوظيفة بنجاح وستظهر بعد الموافقة');
        else toast.error('فشل نشر الوظيفة');
      }
      resetForm();
      fetchJobs();
      navigate('company-manage-jobs');
    } catch { toast.error('حدث خطأ'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteJob = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/jobs?id=${deleteId}`, { method: 'DELETE' });
      if (res.ok) { toast.success('تم حذف الوظيفة'); fetchJobs(); }
      else toast.error('فشل حذف الوظيفة');
    } catch { toast.error('حدث خطأ'); }
    setDeleteId(null);
  };

  const toggleJobStatus = async (job: Job) => {
    const newStatus = job.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      const res = await fetch('/api/jobs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: job.id, status: newStatus }) });
      if (res.ok) { toast.success(`تم ${newStatus === 'ACTIVE' ? 'تفعيل' : 'إيقاف'} الوظيفة`); fetchJobs(); }
    } catch { toast.error('حدث خطأ'); }
  };

  const updateApplication = async (appId: string, data: { status?: string; rating?: number; notes?: string }) => {
    try {
      const res = await fetch('/api/applications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: appId, ...data }) });
      if (res.ok) {
        toast.success('تم التحديث');
        if (selectedJob) loadApplicants(selectedJob);
      }
    } catch { toast.error('حدث خطأ'); }
  };

  const totalApplicants = jobs.reduce((acc, j) => acc + (j._count?.applications || 0), 0);
  const activeJobs = jobs.filter(j => j.status === 'ACTIVE').length;

  const filteredJobs = jobs.filter(j =>
    j.position.includes(searchTerm) || j.companyName.includes(searchTerm)
  );

  // ─── OVERVIEW ────────────────────────────────────────
  if (currentView === 'company-dashboard') {
    return (
      <div dir="rtl" className="page-transition min-h-screen" style={{ background: 'linear-gradient(180deg, #f7faf8 0%, #f1f5f4 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
          {/* ── Premium Hero ── */}
          <div className="relative overflow-hidden rounded-2xl mb-8" style={{ boxShadow: '0 4px 14px rgba(4, 120, 87, 0.18), 0 2px 6px rgba(4, 120, 87, 0.08)' }}>
            <div className="absolute inset-0 gradient-mesh" />
            <div className="absolute inset-0 hero-aurora" />
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }} />

            <div className="relative p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                {/* Icon cluster */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center -mr-4">
                    <Briefcase className="w-5 h-5 text-emerald-100" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-premium bg-white/15 text-white border-white/20 backdrop-blur-sm">
                      <Building2 className="w-3 h-3" />
                      مؤسسة
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
                    مرحباً {user?.company?.name || user?.name}
                  </h1>
                  <p className="text-emerald-50/90 text-sm sm:text-base">
                    إدارة وظائفك ومتابعة المتقدمين — كل ما تحتاجه في مكان واحد
                  </p>
                </div>

                {/* Quick stats strip */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-5 shrink-0 pt-1 border-t sm:border-t-0 sm:border-r sm:pr-5 border-white/15 mt-3 sm:mt-0">
                  <div className="text-center">
                    <div className="premium-number text-2xl sm:text-3xl font-extrabold leading-none">{jobs.length}</div>
                    <div className="text-emerald-100/80 text-[11px] mt-1">وظيفة</div>
                  </div>
                  <div className="w-px h-9 bg-white/15" />
                  <div className="text-center">
                    <div className="premium-number text-2xl sm:text-3xl font-extrabold leading-none">{activeJobs}</div>
                    <div className="text-emerald-100/80 text-[11px] mt-1">نشطة</div>
                  </div>
                  <div className="w-px h-9 bg-white/15" />
                  <div className="text-center">
                    <div className="premium-number text-2xl sm:text-3xl font-extrabold leading-none">{totalApplicants}</div>
                    <div className="text-emerald-100/80 text-[11px] mt-1">متقدم</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stat Cards Section ── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
              <span className="section-accent-bar" />
              نظرة سريعة
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'إجمالي الوظائف', value: jobs.length, icon: Briefcase, iconClass: 'stat-icon-emerald', sub: 'منشورة' },
              { label: 'وظائف نشطة', value: activeJobs, icon: TrendingUp, iconClass: 'stat-icon-teal', sub: 'متاحة للتقديم' },
              { label: 'إجمالي المتقدمين', value: totalApplicants, icon: Users, iconClass: 'stat-icon-amber', sub: 'تراكمي' },
              { label: 'قيد المراجعة', value: jobs.filter(j => j.status === 'PENDING').length, icon: Clock, iconClass: 'stat-icon-plum', sub: 'بانتظار الموافقة' },
            ].map((stat, i) => (
              <Card key={i} className="stat-card-pro border-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.iconClass}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
                  <p className="premium-number text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">{stat.value}</p>
                  {stat.sub && <p className="text-[11px] text-gray-400 mt-2">{stat.sub}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions + Recent */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 card-premium border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-1">
                  <span className="section-accent-bar" />
                  إجراءات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-end gap-2 bg-emerald-700 hover:bg-emerald-800 shadow-sm" style={{ boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)' }} onClick={() => { resetForm(); navigate('company-post-job'); }}>
                  <Plus className="w-4 h-4" /> نشر وظيفة جديدة
                </Button>
                <Button variant="outline" className="w-full justify-end gap-2 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => navigate('company-manage-jobs')}>
                  <Briefcase className="w-4 h-4" /> إدارة الوظائف
                </Button>
                <Button variant="outline" className="w-full justify-end gap-2 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => navigate('company-applicants')}>
                  <Users className="w-4 h-4" /> عرض المتقدمين
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 card-premium border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-1">
                    <span className="section-accent-bar" />
                    آخر الوظائف المنشورة
                  </CardTitle>
                  <Button variant="ghost" className="text-emerald-700 hover:bg-emerald-50 text-sm font-semibold" onClick={() => navigate('company-manage-jobs')}>
                    عرض الكل <ChevronLeft className="w-4 h-4 mr-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer-pro h-16 w-full" />)}</div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="empty-state-circle w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-7 h-7 text-emerald-500" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-1">لم تنشر أي وظائف بعد</p>
                    <p className="text-gray-400 text-sm">ابدأ بنشر وظيفتك الأولى لجذب المرشحين المناسبين</p>
                    <Button className="mt-4 bg-emerald-700 hover:bg-emerald-800" onClick={() => navigate('company-post-job')}>
                      <Plus className="w-4 h-4 ml-2" /> نشر وظيفة
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.slice(0, 5).map(job => {
                      const SIcon = statusConfig[job.status]?.icon || Clock;
                      return (
                        <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 hover:bg-emerald-50/40 hover:ring-1 hover:ring-emerald-100 transition-all">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{job.position}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{timeAgo(job.createdAt)} · {job._count?.applications || 0} متقدم</p>
                          </div>
                          <div className="flex items-center gap-2 mr-3">
                            <Badge className={`badge-premium ${statusConfig[job.status]?.color || 'bg-gray-100'}`}>
                              <SIcon className="w-3 h-3 ml-1" />{statusConfig[job.status]?.label}
                            </Badge>
                            <Button variant="ghost" size="sm" onClick={() => navigate('job-detail', { id: job.id })}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── POST JOB ────────────────────────────────────────
  if (currentView === 'company-post-job') {
    return (
      <div dir="rtl" className="page-transition min-h-screen" style={{ background: 'linear-gradient(180deg, #f7faf8 0%, #f1f5f4 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
          <Button variant="ghost" className="mb-5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => navigate('company-dashboard')}>
            <ChevronLeft className="w-4 h-4 ml-1" /> العودة
          </Button>
          <Card className="card-premium border-0">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-1">
                <span className="section-accent-bar" />
                {editingJobId ? 'تعديل الوظيفة' : 'نشر وظيفة جديدة'}
              </CardTitle>
              <CardDescription className="text-gray-500">أدخل تفاصيل الوظيفة بدقة لجذب المرشحين المناسبين</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Position */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">المنصب المطلوب <span className="text-red-500">*</span></Label>
                <Input placeholder="مثال: مهندس برمجيات" value={formPos} onChange={e => setFormPos(e.target.value)} className="h-11" />
              </div>

              {/* Activity Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">نوع النشاط <span className="text-red-500">*</span></Label>
                <Select value={formActivity} onValueChange={setFormActivity}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="اختر نوع النشاط" /></SelectTrigger>
                  <SelectContent>{ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">المهارات المطلوبة</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS_LIST.map(skill => (
                    <button key={skill} type="button" onClick={() => setFormSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all cursor-pointer ${formSkills.includes(skill) ? 'bg-emerald-100 border-emerald-300 text-emerald-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Worker Style + Contract Type */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">نمط العامل</Label>
                  <Select value={formWorker} onValueChange={setFormWorker}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disciplined">منضبط</SelectItem>
                      <SelectItem value="independent">مستقل</SelectItem>
                      <SelectItem value="social">اجتماعي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">نوع العقد</Label>
                  <Select value={formContract} onValueChange={setFormContract}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">دائم</SelectItem>
                      <SelectItem value="temporary">مؤقت</SelectItem>
                      <SelectItem value="training">تدريب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">متوسط الميزانية <span className="text-gray-400 font-normal">(اختياري)</span></Label>
                <Input placeholder="مثال: 50,000 - 80,000 د.ج" value={formBudget} onChange={e => setFormBudget(e.target.value)} className="h-11 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
                {formBudget && (
                  <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(254, 243, 199, 0.6)', color: '#b45309' }}>
                    <DollarSign className="w-3 h-3" />
                    ميزانية مميزة
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">وصف الوظيفة</Label>
                <Textarea placeholder="صف الوظيفة والمهام المطلوبة..." value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={4} className="resize-none" />
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">متطلبات إضافية</Label>
                <Textarea placeholder="أي متطلبات أخرى..." value={formReq} onChange={e => setFormReq(e.target.value)} rows={3} className="resize-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmitJob} disabled={submitting} className="flex-1 h-11 bg-emerald-700 hover:bg-emerald-800 text-white">
                  {submitting ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> جاري الحفظ...</span> : editingJobId ? 'تحديث الوظيفة' : 'نشر الوظيفة'}
                </Button>
                <Button variant="outline" onClick={() => { resetForm(); navigate('company-dashboard'); }} className="h-11 px-6">إلغاء</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── MANAGE JOBS ─────────────────────────────────────
  if (currentView === 'company-manage-jobs') {
    return (
      <div dir="rtl" className="page-transition min-h-screen" style={{ background: 'linear-gradient(180deg, #f7faf8 0%, #f1f5f4 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <span className="section-accent-bar" />
                إدارة الوظائف
              </h1>
              <p className="text-gray-500 text-sm mt-2 mr-3">{jobs.length} وظيفة منشورة</p>
            </div>
            <Button className="bg-emerald-700 hover:bg-emerald-800 shadow-sm" style={{ boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)' }} onClick={() => { resetForm(); navigate('company-post-job'); }}>
              <Plus className="w-4 h-4 ml-2" /> وظيفة جديدة
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="بحث في الوظائف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pr-10 h-11 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
          </div>

          {loading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer-pro h-24 w-full" />)}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20">
              <div className="empty-state-circle w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Briefcase className="w-9 h-9 text-emerald-500" />
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-1">لا توجد وظائف</p>
              <p className="text-gray-400 text-sm">ابدأ بنشر وظيقتك الأولى لجذب المرشحين</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map(job => {
                const SIcon = statusConfig[job.status]?.icon || Clock;
                return (
                  <Card key={job.id} className="card-premium border-0">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 truncate text-base">{job.position}</h3>
                            <Badge className={`badge-premium ${statusConfig[job.status]?.color || 'bg-gray-100'}`}>
                              <SIcon className="w-3 h-3 ml-1" />{statusConfig[job.status]?.label}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span>{contractLabels[job.contractType]}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job._count?.applications || 0} متقدم</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{job.views} مشاهدة</span>
                            <span>·</span>
                            <span>{timeAgo(job.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button variant="ghost" size="sm" onClick={() => loadApplicants(job)} title="المتقدمون">
                            <Users className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(job)} title="تعديل">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => toggleJobStatus(job)} title={job.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}>
                            {job.status === 'ACTIVE' ? <XCircle className="w-4 h-4 text-amber-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </Button>
                          <AlertDialog open={deleteId === job.id} onOpenChange={open => { if (!open) setDeleteId(null); else setDeleteId(job.id); }}>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>حذف الوظيفة</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف وظيفة &quot;{job.position}&quot;؟ لا يمكن التراجع.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={handleDeleteJob} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Applicants Dialog */}
        <Dialog open={!!selectedJob} onOpenChange={open => { if (!open) setSelectedJob(null); }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900">المتقدمون لوظيفة: {selectedJob?.position}</DialogTitle>
            </DialogHeader>
            {applicants.length === 0 ? (
              <div className="text-center py-12">
                <div className="empty-state-circle w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-gray-700 font-semibold mb-1">لا يوجد متقدمون بعد</p>
                <p className="text-gray-400 text-sm">سيظهر هنا كل من يقدم على هذه الوظيفة</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {applicants.map(app => (
                  <Card key={app.id} className="card-premium border-0">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-emerald-50"><AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">{(app.seeker?.name || '?')[0]}</AvatarFallback></Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{app.seeker?.name}</p>
                            <p className="text-xs text-gray-500">{timeAgo(app.createdAt)}</p>
                          </div>
                        </div>
                        <Badge className={`badge-premium ${statusConfig[app.status]?.color || 'bg-gray-100'}`}>
                          {statusConfig[app.status]?.label || app.status}
                        </Badge>
                      </div>

                      {app.seeker?.resume && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                          <p><span className="text-gray-500">المستوى:</span> <span className="font-medium">{app.seeker.resume.education}</span></p>
                          <p><span className="text-gray-500">العمر:</span> <span className="font-medium">{app.seeker.resume.age} سنة</span></p>
                          {app.seeker.resume.skills && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {parseSkills(app.seeker.resume.skills).slice(0, 5).map((s, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-emerald-50 text-emerald-600">{s}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-gray-500">التقييم:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setRatingMap(prev => ({ ...prev, [app.id]: star }))}
                              className="cursor-pointer">
                              <Star className={`w-4 h-4 ${star <= (ratingMap[app.id] || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <Textarea placeholder="ملاحظات..." value={notesMap[app.id] || ''} onChange={e => setNotesMap(prev => ({ ...prev, [app.id]: e.target.value }))} rows={2} className="text-sm mb-3 resize-none" />

                      {/* Actions */}
                      <div className="flex gap-2">
                        {app.status === 'PENDING' && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateApplication(app.id, { status: 'ACCEPTED', rating: ratingMap[app.id] || null, notes: notesMap[app.id] || null })}>
                              <CheckCircle2 className="w-4 h-4 ml-1" /> قبول
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateApplication(app.id, { status: 'REJECTED', rating: ratingMap[app.id] || null, notes: notesMap[app.id] || null })}>
                              <XCircle className="w-4 h-4 ml-1" /> رفض
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="mr-auto" onClick={() => { navigate('messages', { receiverId: app.seekerId }); }}>
                          <MessageSquare className="w-4 h-4 ml-1" /> مراسلة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── APPLICANTS VIEW ─────────────────────────────────
  if (currentView === 'company-applicants') {
    const jobsWithApplicants = jobs.filter(j => (j._count?.applications || 0) > 0);
    return (
      <div dir="rtl" className="page-transition min-h-screen" style={{ background: 'linear-gradient(180deg, #f7faf8 0%, #f1f5f4 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="section-accent-bar" />
              المتقدمون
            </h1>
            <p className="text-gray-500 text-sm mt-2 mr-3">متابعة وتقييم المتقدمين لوظائفك</p>
          </div>

          {loading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="shimmer-pro h-32 w-full" />)}</div>
          ) : jobsWithApplicants.length === 0 ? (
            <div className="text-center py-20">
              <div className="empty-state-circle w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Users className="w-9 h-9 text-emerald-500" />
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-1">لا يوجد متقدمون بعد</p>
              <p className="text-gray-400 text-sm mb-5">انشر وظيفة جديدة لتبدأ بتلقي طلبات المتقدمين</p>
              <Button className="bg-emerald-700 hover:bg-emerald-800 shadow-sm" style={{ boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)' }} onClick={() => navigate('company-post-job')}>
                <Plus className="w-4 h-4 ml-2" /> نشر وظيفة
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobsWithApplicants.map(job => (
                <Card key={job.id} className="quick-action-card border-0 cursor-pointer" onClick={() => loadApplicants(job)}>
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{job.position}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{contractLabels[job.contractType]} · {timeAgo(job.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="badge-premium" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#b45309' }}>{job._count?.applications || 0} متقدم</Badge>
                        <ChevronLeft className="quick-action-arrow w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Applicants Dialog (same as in manage-jobs) */}
        <Dialog open={!!selectedJob} onOpenChange={open => { if (!open) setSelectedJob(null); }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900">المتقدمون لوظيفة: {selectedJob?.position}</DialogTitle>
            </DialogHeader>
            {applicants.length === 0 ? (
              <div className="text-center py-12">
                <div className="empty-state-circle w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-gray-700 font-semibold mb-1">لا يوجد متقدمون بعد</p>
                <p className="text-gray-400 text-sm">سيظهر هنا كل من يقدم على هذه الوظيفة</p>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {applicants.map(app => (
                  <Card key={app.id} className="card-premium border-0">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-emerald-50"><AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">{(app.seeker?.name || '?')[0]}</AvatarFallback></Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{app.seeker?.name}</p>
                            <p className="text-xs text-gray-500">{timeAgo(app.createdAt)}</p>
                          </div>
                        </div>
                        <Badge className={`badge-premium ${statusConfig[app.status]?.color || 'bg-gray-100'}`}>{statusConfig[app.status]?.label}</Badge>
                      </div>
                      {app.seeker?.resume && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                          <p><span className="text-gray-500">المستوى:</span> <span className="font-medium">{app.seeker.resume.education}</span></p>
                          {app.seeker.resume.skills && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {parseSkills(app.seeker.resume.skills).slice(0, 5).map((s, i) => (
                                <Badge key={i} variant="secondary" className="text-xs bg-emerald-50 text-emerald-600">{s}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-gray-500">التقييم:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button key={star} onClick={() => setRatingMap(prev => ({ ...prev, [app.id]: star }))} className="cursor-pointer">
                              <Star className={`w-4 h-4 ${star <= (ratingMap[app.id] || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea placeholder="ملاحظات..." value={notesMap[app.id] || ''} onChange={e => setNotesMap(prev => ({ ...prev, [app.id]: e.target.value }))} rows={2} className="text-sm mb-3 resize-none" />
                      <div className="flex gap-2">
                        {app.status === 'PENDING' && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateApplication(app.id, { status: 'ACCEPTED', rating: ratingMap[app.id] || null, notes: notesMap[app.id] || null })}>
                              <CheckCircle2 className="w-4 h-4 ml-1" /> قبول
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateApplication(app.id, { status: 'REJECTED', rating: ratingMap[app.id] || null, notes: notesMap[app.id] || null })}>
                              <XCircle className="w-4 h-4 ml-1" /> رفض
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="mr-auto" onClick={() => { navigate('messages', { receiverId: app.seekerId }); }}>
                          <MessageSquare className="w-4 h-4 ml-1" /> مراسلة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}