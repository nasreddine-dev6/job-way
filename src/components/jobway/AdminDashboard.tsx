'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import {
  Users, Briefcase, FileText, TrendingUp, CheckCircle2, XCircle, Clock,
  Eye, Trash2, Shield, ChevronLeft, Search, BarChart3, UserCog,
  Building2, Activity, Bell, Megaphone, RefreshCw, Send, GraduationCap, Sparkles,
  Download, KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import type { User as AppUser, Job, Application as AppApplication } from '@/lib/types';
import { parseSkillsArray } from '@/lib/types';

/* ─── Helpers ──────────────────────────────────────────────── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 30) return `منذ ${days} أيام`;
  return `منذ ${Math.floor(days / 30)} شهر`;
}

const roleColors: Record<string, string> = {
  SEEKER: 'bg-emerald-100 text-emerald-700',
  COMPANY: 'bg-amber-100 text-amber-700',
  ADMIN: 'bg-purple-100 text-purple-700',
};
const roleLabels: Record<string, string> = { SEEKER: 'باحث', COMPANY: 'مؤسسة', ADMIN: 'مدير' };
const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};
const statusLabels: Record<string, string> = {
  PENDING: 'قيد المراجعة', ACTIVE: 'نشطة', CLOSED: 'مغلقة',
  ACCEPTED: 'مقبول', REJECTED: 'مرفوض',
};

/* ─── Chart palette (no indigo/blue) ──────────────────────────── */
const CHART = {
  emerald: '#047857',
  emeraldDeep: '#065f46',
  emeraldLight: '#10b981',
  amber: '#d97706',
  amberLight: '#f59e0b',
  plum: '#7c3aed',
  slate: '#64748b',
  slateLight: '#94a3b8',
  red: '#dc2626',
  axis: '#cbd5e1',
  tick: '#64748b',
} as const;

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

/* Counts items by a computed string key. Returns a Record<key, count>. */
function countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const k = keyFn(item);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

/** Returns YYYY-MM key for an ISO date string, or null when invalid. */
function monthKey(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Builds the list of last 6 months (including the current one), oldest first. */
function lastSixMonths(): Array<{ key: string; label: string }> {
  const now = new Date();
  const out: Array<{ key: string; label: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${ARABIC_MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;
    out.push({ key, label });
  }
  return out;
}

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  fontFamily: 'inherit',
  fontSize: 12,
} as const;

export default function AdminDashboard() {
  const { currentView, navigate } = useAppStore();
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('ALL');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');

  // Modals
  const [editUser, setEditUser] = useState<any>(null);
  const [editRole, setEditRole] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'job'; id: string; name: string } | null>(null);

  // Admin power-tool modals
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const [notifyUser, setNotifyUser] = useState<AppUser | null>(null);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifying, setNotifying] = useState(false);

  const [previewJob, setPreviewJob] = useState<Job | null>(null);
  const [applicantDetails, setApplicantDetails] = useState<AppApplication | null>(null);

  const [downloadCodeOpen, setDownloadCodeOpen] = useState(false);
  const [downloadCode, setDownloadCode] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, jobsRes, appsRes] = await Promise.all([
        fetch('/api/users?action=stats'),
        fetch('/api/users'),
        fetch('/api/jobs?status=ALL'),
        fetch('/api/applications'),
      ]);
      if (statsRes.ok) setStats((await statsRes.json()).stats || {});
      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      if (jobsRes.ok) setJobs((await jobsRes.json()).jobs || []);
      if (appsRes.ok) setApplications((await appsRes.json()).applications || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/users?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('تم حذف المستخدم'); fetchAll(); }
      else toast.error('فشل الحذف');
    } catch { toast.error('حدث خطأ'); }
    setDeleteTarget(null);
  };

  const handleDeleteJob = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/jobs?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('تم حذف الوظيفة'); fetchAll(); }
      else toast.error('فشل الحذف');
    } catch { toast.error('حدث خطأ'); }
    setDeleteTarget(null);
  };

  const handleUpdateRole = async () => {
    if (!editUser) return;
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editUser.id, name: editUser.name, role: editRole }),
      });
      if (res.ok) { toast.success('تم تحديث الدور'); setEditUser(null); fetchAll(); }
      else toast.error('فشل التحديث');
    } catch { toast.error('حدث خطأ'); }
  };

  const handleUpdateJobStatus = async (jobId: string, status: string) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, status }),
      });
      if (res.ok) { toast.success('تم التحديث'); fetchAll(); }
      else { toast.error('فشل التحديث'); }
    } catch { toast.error('حدث خطأ'); }
  };

  const handleUpdateAppStatus = async (appId: string, status: string) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appId, status }),
      });
      if (res.ok) { toast.success('تم التحديث'); fetchAll(); }
      else { toast.error('فشل التحديث'); }
    } catch { toast.error('حدث خطأ'); }
  };

  /* ── Admin power-tool handlers ─────────────────────────────── */

  // Broadcast: loops through every user and POSTs a notification to each.
  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('يرجى إدخال العنوان والرسالة');
      return;
    }
    if (users.length === 0) {
      toast.error('لا يوجد مستخدمون لإرسال الإشعار إليهم');
      return;
    }
    setBroadcasting(true);
    try {
      let sent = 0;
      let failed = 0;
      for (const u of users) {
        try {
          const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: u.id,
              title: broadcastTitle.trim(),
              message: broadcastMessage.trim(),
              type: 'SYSTEM',
            }),
          });
          if (res.ok) sent++; else failed++;
        } catch { failed++; }
      }
      if (sent > 0) {
        toast.success(
          `تم إرسال الإشعار إلى ${sent} مستخدم${failed > 0 ? ` (فشل ${failed})` : ''}`,
        );
      } else {
        toast.error('فشل إرسال الإشعار');
      }
      setBroadcastOpen(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setBroadcasting(false);
    }
  };

  // Single-user notification.
  const handleSendNotification = async () => {
    if (!notifyUser) return;
    if (!notifyTitle.trim() || !notifyMessage.trim()) {
      toast.error('يرجى إدخال العنوان والرسالة');
      return;
    }
    setNotifying(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: notifyUser.id,
          title: notifyTitle.trim(),
          message: notifyMessage.trim(),
          type: 'SYSTEM',
        }),
      });
      if (res.ok) {
        toast.success(`تم إرسال الإشعار إلى ${notifyUser.name}`);
        setNotifyUser(null);
        setNotifyTitle('');
        setNotifyMessage('');
      } else {
        toast.error('فشل الإرسال');
      }
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setNotifying(false);
    }
  };

  /* ── Chart data (memoized — derived from existing arrays) ──── */
  const usersByRoleData = useMemo(() => {
    const counts = countBy(users, u => (u as AppUser).role);
    return [
      { name: 'باحث', value: counts.SEEKER || 0 },
      { name: 'مؤسسة', value: counts.COMPANY || 0 },
      { name: 'مدير', value: counts.ADMIN || 0 },
    ];
  }, [users]);

  const jobsByStatusData = useMemo(() => {
    const counts = countBy(jobs, j => (j as Job).status);
    return [
      { name: 'نشطة', value: counts.ACTIVE || 0 },
      { name: 'قيد المراجعة', value: counts.PENDING || 0 },
      { name: 'مغلقة', value: counts.CLOSED || 0 },
    ];
  }, [jobs]);

  const appsByStatusData = useMemo(() => {
    const counts = countBy(applications, a => (a as AppApplication).status);
    return [
      { name: 'قيد المراجعة', value: counts.PENDING || 0 },
      { name: 'مقبول', value: counts.ACCEPTED || 0 },
      { name: 'مرفوض', value: counts.REJECTED || 0 },
    ];
  }, [applications]);

  const platformActivityData = useMemo(() => {
    const months = lastSixMonths();
    const uByMonth = countBy(
      users.filter(u => monthKey(u.createdAt)),
      u => monthKey(u.createdAt) as string,
    );
    const jByMonth = countBy(
      jobs.filter(j => monthKey(j.createdAt)),
      j => monthKey(j.createdAt) as string,
    );
    return months.map(m => ({
      month: m.label,
      تسجيلات: uByMonth[m.key] || 0,
      وظائف: jByMonth[m.key] || 0,
    }));
  }, [users, jobs]);

  const handleDownload = async () => {
    if (downloadCode !== '0131') {
      toast.error('الرمز غير صحيح');
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch('/api/admin-download');
      if (!res.ok) {
        throw new Error('فشل تحميل الحزمة');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'JobWay.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadCodeOpen(false);
      setDownloadCode('');
      toast.success('تم تحميل حزمة المشروع');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'فشل تحميل الحزمة');
    } finally {
      setDownloading(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
    if (userSearch && !u.name.includes(userSearch) && !u.email.includes(userSearch)) return false;
    return true;
  });
  const filteredJobs = jobs.filter(j => {
    if (jobStatusFilter !== 'ALL' && j.status !== jobStatusFilter) return false;
    if (jobSearch && !j.position.includes(jobSearch) && !j.companyName.includes(jobSearch)) return false;
    return true;
  });
  const filteredApps = applications.filter(a => {
    if (appStatusFilter !== 'ALL' && a.status !== appStatusFilter) return false;
    return true;
  });

  /* ════════════════════════════════════════════════════════════
     OVERVIEW
  ════════════════════════════════════════════════════════════ */
  if (currentView === 'admin-dashboard') {
    const statCards: Array<{
      label: string;
      value: string | number;
      icon: React.ElementType;
      iconClass: string;
      trend: string;
      trendDir: 'up' | 'down' | 'neutral';
      sub: string;
    }> = [
      { label: 'إجمالي المستخدمين', value: stats.totalUsers || 0, icon: Users, iconClass: 'stat-icon-slate', trend: '+12%', trendDir: 'up', sub: 'هذا الشهر' },
      { label: 'الوظائف النشطة', value: stats.activeJobs || 0, icon: Briefcase, iconClass: 'stat-icon-emerald', trend: '+8%', trendDir: 'up', sub: 'منشورة' },
      { label: 'إجمالي الطلبات', value: stats.totalApplications || 0, icon: FileText, iconClass: 'stat-icon-sky', trend: '+24%', trendDir: 'up', sub: 'تراكمي' },
      { label: 'الباحثون عن عمل', value: stats.seekers || 0, icon: UserCog, iconClass: 'stat-icon-teal', trend: '+5%', trendDir: 'up', sub: 'مسجلون' },
      { label: 'المؤسسات', value: stats.companies || 0, icon: Building2, iconClass: 'stat-icon-amber', trend: '+3%', trendDir: 'up', sub: 'نشطة' },
      { label: 'وظائف قيد المراجعة', value: stats.pendingJobs || 0, icon: Clock, iconClass: 'stat-icon-amber', trend: '', trendDir: 'neutral', sub: 'بانتظار الموافقة' },
      { label: 'طلبات مقبولة', value: stats.acceptedApps || 0, icon: CheckCircle2, iconClass: 'stat-icon-emerald', trend: '+18%', trendDir: 'up', sub: 'إيجابية' },
      { label: 'معدل التوظيف', value: `${stats.hireRate || 0}%`, icon: TrendingUp, iconClass: 'stat-icon-plum', trend: '+2.4%', trendDir: 'up', sub: 'نمو' },
    ];

    return (
      <div dir="rtl" className="page-transition min-h-screen" style={{ background: 'linear-gradient(180deg, #f7faf8 0%, #f1f5f4 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
          {/* ── Premium Hero ── */}
          <div className="relative overflow-hidden rounded-2xl mb-8 shadow-lg" style={{ boxShadow: '0 4px 14px rgba(4, 120, 87, 0.18), 0 2px 6px rgba(4, 120, 87, 0.08)' }}>
            {/* Mesh gradient background */}
            <div className="absolute inset-0 gradient-mesh" />
            <div className="absolute inset-0 hero-aurora" />
            {/* Subtle dotted pattern */}
            <div className="absolute inset-0 opacity-[0.06]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }} />

            <div className="relative p-6 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                {/* Icon cluster */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center -mr-4">
                    <BarChart3 className="w-5 h-5 text-emerald-100" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-premium bg-white/15 text-white border-white/20 backdrop-blur-sm">
                      <Shield className="w-3 h-3" />
                      مدير النظام
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
                    لوحة تحكم المدير
                  </h1>
                  <p className="text-emerald-50/90 text-sm sm:text-base">
                    إدارة شاملة لمنصة JobWay — نظرة موحدة على المستخدمين والوظائف والطلبات
                  </p>
                </div>

                {/* Quick stats strip */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-5 shrink-0 pt-1 border-t sm:border-t-0 sm:border-r sm:pr-5 border-white/15 mt-3 sm:mt-0">
                  <div className="text-center">
                    <div className="premium-number text-2xl sm:text-3xl font-extrabold leading-none">{stats.totalUsers || 0}</div>
                    <div className="text-emerald-100/80 text-[11px] mt-1">مستخدم</div>
                  </div>
                  <div className="w-px h-9 bg-white/15" />
                  <div className="text-center">
                    <div className="premium-number text-2xl sm:text-3xl font-extrabold leading-none">{stats.activeJobs || 0}</div>
                    <div className="text-emerald-100/80 text-[11px] mt-1">وظيفة نشطة</div>
                  </div>
                  <div className="w-px h-9 bg-white/15" />
                  <div className="text-center">
                    <div className="premium-number text-2xl sm:text-3xl font-extrabold leading-none">{stats.totalApplications || 0}</div>
                    <div className="text-emerald-100/80 text-[11px] mt-1">طلب</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stat Cards Grid ── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
              <span className="section-accent-bar" />
              نظرة عامة على المؤشرات
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((s, i) => (
              <Card key={i} className="stat-card-pro border-0">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.iconClass}`}>
                      <s.icon className="w-5 h-5" />
                    </div>
                    {s.trend && (
                      <span className={s.trendDir === 'up' ? 'trend-up' : s.trendDir === 'down' ? 'trend-down' : 'trend-neutral'}>
                        <TrendingUp className={`w-3 h-3 ${s.trendDir === 'down' ? 'rotate-180' : ''}`} />
                        {s.trend}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
                  <p className="premium-number text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">{s.value}</p>
                  {s.sub && <p className="text-[11px] text-gray-400 mt-2">{s.sub}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Quick Actions Row ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
              <span className="section-accent-bar" />
              إجراءات سريعة
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => setBroadcastOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white h-10 shadow-sm"
              >
                <Megaphone className="w-4 h-4 ml-1" />
                بث إشعار
              </Button>
              <Button
                onClick={() => fetchAll()}
                variant="outline"
                className="h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <RefreshCw className="w-4 h-4 ml-1" />
                تحديث الإحصائيات
              </Button>
            </div>
          </div>

          {/* ── Analytics Panel (لوحة التحليلات) ── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
              <span className="section-accent-bar" />
              لوحة التحليلات
            </h2>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              مباشر
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {/* Chart 1 — Users by Role (vertical bars) */}
            <Card className="card-premium border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span className="section-accent-bar" />
                  <Users className="w-4 h-4 text-emerald-700" />
                  المستخدمون حسب الدور
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={usersByRoleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.axis} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: CHART.tick }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: CHART.tick }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                    <Tooltip
                      cursor={{ fill: 'rgba(4, 120, 87, 0.06)' }}
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                      formatter={(value: number) => [`${value} مستخدم`, 'العدد']}
                    />
                    <Bar dataKey="value" name="المستخدمون" fill={CHART.emerald} radius={[6, 6, 0, 0]} maxBarSize={64} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2 — Jobs Distribution (donut) */}
            <Card className="card-premium border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span className="section-accent-bar" />
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  توزيع الوظائف
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={jobsByStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      <Cell fill={CHART.emerald} />
                      <Cell fill={CHART.amber} />
                      <Cell fill={CHART.slateLight} />
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: number, name: string) => [`${value} وظيفة`, name]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={9}
                      wrapperStyle={{ fontSize: 12, color: CHART.tick, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 3 — Applications by Status (horizontal bars) */}
            <Card className="card-premium border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span className="section-accent-bar" />
                  <FileText className="w-4 h-4 text-emerald-700" />
                  الطلبات حسب الحالة
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={appsByStatusData}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.axis} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: CHART.tick }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: CHART.tick }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip
                      cursor={{ fill: 'rgba(4, 120, 87, 0.06)' }}
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value: number) => [`${value} طلب`, 'العدد']}
                    />
                    <Bar dataKey="value" name="الطلبات" radius={[0, 6, 6, 0]} maxBarSize={32}>
                      <Cell fill={CHART.amber} />
                      <Cell fill={CHART.emerald} />
                      <Cell fill={CHART.red} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 4 — Platform Activity (area chart, last 6 months) */}
            <Card className="card-premium border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <span className="section-accent-bar" />
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  نشاط المنصة — آخر 6 أشهر
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={platformActivityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-users" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART.emerald} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={CHART.emerald} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="grad-jobs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART.amber} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={CHART.amber} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART.axis} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART.tick }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: CHART.tick }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={{ color: '#0f172a', fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="تسجيلات" stroke={CHART.emerald} strokeWidth={2.5} fill="url(#grad-users)" />
                    <Area type="monotone" dataKey="وظائف" stroke={CHART.amber} strokeWidth={2.5} fill="url(#grad-jobs)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ── Quick Nav Section ── */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
              <span className="section-accent-bar" />
              إدارة المنصة
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { title: 'إدارة المستخدمين', desc: `${users.length} مستخدم مسجل`, icon: Users, view: 'admin-users' as const },
              { title: 'إدارة الوظائف', desc: `${jobs.length} وظيفة`, icon: Briefcase, view: 'admin-jobs' as const },
              { title: 'إدارة الطلبات', desc: `${applications.length} طلب`, icon: FileText, view: 'admin-applications' as const },
            ].map((item, i) => (
              <Card key={i} className="quick-action-card border-0" onClick={() => navigate(item.view)}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="quick-action-icon w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronLeft className="quick-action-arrow w-5 h-5 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Broadcast Notification Dialog ── */}
          <Dialog open={broadcastOpen} onOpenChange={open => {
            if (!broadcasting) setBroadcastOpen(open);
          }}>
            <DialogContent className="rounded-2xl sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-emerald-700" />
                  بث إشعار للجميع
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  سيتم إرسال الإشعار إلى جميع المستخدمين المسجّلين ({users.length} مستخدم).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="broadcast-title" className="text-sm font-medium text-gray-700">عنوان الإشعار</Label>
                  <Input
                    id="broadcast-title"
                    placeholder="مثال: صيانة مجدولة"
                    value={broadcastTitle}
                    onChange={e => setBroadcastTitle(e.target.value)}
                    className="h-11"
                    disabled={broadcasting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="broadcast-message" className="text-sm font-medium text-gray-700">نص الرسالة</Label>
                  <Textarea
                    id="broadcast-message"
                    placeholder="اكتب نص الإشعار هنا..."
                    value={broadcastMessage}
                    onChange={e => setBroadcastMessage(e.target.value)}
                    rows={4}
                    disabled={broadcasting}
                    className="resize-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => setBroadcastOpen(false)}
                    disabled={broadcasting}
                  >
                    إلغاء
                  </Button>
                  <Button
                    className="flex-1 h-11 bg-emerald-700 hover:bg-emerald-800"
                    onClick={handleBroadcast}
                    disabled={broadcasting || !broadcastTitle.trim() || !broadcastMessage.trim()}
                  >
                    {broadcasting ? (
                      <>
                        <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                        جارٍ الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-1" />
                        إرسال إلى {users.length} مستخدم
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Download code prompt — triggered by the hidden version icon */}
          <Dialog open={downloadCodeOpen} onOpenChange={open => {
            setDownloadCodeOpen(open);
            if (!open) setDownloadCode('');
          }}>
            <DialogContent className="rounded-2xl max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-700" />
                  رمز التحقق
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  أدخل الرمز للوصول إلى الحزمة
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <Input
                  type="password"
                  inputMode="numeric"
                  placeholder="• • • •"
                  value={downloadCode}
                  onChange={e => setDownloadCode(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleDownload(); }}
                  className="h-12 text-center text-lg tracking-[0.5em] font-bold"
                  dir="ltr"
                  autoFocus
                />
                <Button
                  onClick={handleDownload}
                  disabled={downloading || downloadCode.length < 4}
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800"
                >
                  {downloading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      جاري التحضير…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      تحميل الحزمة
                    </span>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Hidden download trigger — bottom of the page, near the footer separator */}
        <div className="max-w-7xl mx-auto px-4 mt-2 pb-4">
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <p className="text-[10px] text-slate-300 select-none">© JobWay — جميع الحقوق محفوظة</p>
            <span className="text-[10px] text-slate-300/60 select-none">v1.0</span>
            <button
              onClick={() => setDownloadCodeOpen(true)}
              className="w-5 h-5 rounded-md flex items-center justify-center text-slate-200 hover:text-slate-400 transition-colors"
              title=""
              aria-label="settings"
              tabIndex={-1}
            >
              <KeyRound className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     USERS MANAGEMENT
  ════════════════════════════════════════════════════════════ */
  if (currentView === 'admin-users') {
    return (
      <div dir="rtl" className="page-transition min-h-screen" style={{ background: 'linear-gradient(180deg, #f7faf8 0%, #f1f5f4 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
          <Button variant="ghost" className="mb-5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => navigate('admin-dashboard')}>
            <ChevronLeft className="w-4 h-4 ml-1" /> العودة للوحة التحكم
          </Button>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="section-accent-bar" />
              إدارة المستخدمين
            </h1>
            <p className="text-gray-500 text-sm mt-2 mr-3">عرض وإدارة جميع الحسابات المسجّلة على المنصة</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="بحث بالاسم أو البريد..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pr-10 h-11 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
            </div>
            <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
              <SelectTrigger className="w-full sm:w-40 h-11 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">الكل</SelectItem>
                <SelectItem value="SEEKER">باحثون</SelectItem>
                <SelectItem value="COMPANY">مؤسسات</SelectItem>
                <SelectItem value="ADMIN">مدراء</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer-pro h-16 w-full" />)}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20">
              <div className="empty-state-circle w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Users className="w-9 h-9 text-emerald-500" />
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-1">لا يوجد مستخدمون</p>
              <p className="text-gray-400 text-sm">جرّب تعديل عوامل التصفية أو ابدأ بدعوة مستخدمين جدد</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200/60" style={{ boxShadow: '0 1px 2px rgba(20, 39, 45, 0.04), 0 4px 16px rgba(20, 39, 45, 0.06)' }}>
                <Table>
                  <TableHeader>
                    <TableRow className="table-professional hover:bg-transparent">
                      <TableHead>المستخدم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead className="text-left">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.id} className="border-slate-100">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 ring-2 ring-emerald-50"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">{u.name[0]}</AvatarFallback></Avatar>
                            <span className="font-semibold text-gray-900">{u.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm" dir="ltr">{u.email}</TableCell>
                        <TableCell><Badge className={`badge-premium ${roleColors[u.role]}`}>{roleLabels[u.role]}</Badge></TableCell>
                        <TableCell className="text-gray-500 text-sm">{timeAgo(u.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="إرسال إشعار"
                              onClick={() => { setNotifyUser(u as AppUser); setNotifyTitle(''); setNotifyMessage(''); }}
                            >
                              <Bell className="w-4 h-4 text-amber-600" />
                            </Button>
                            <Button variant="ghost" size="sm" title="تعديل الدور" onClick={() => { setEditUser(u); setEditRole(u.role); }}>
                              <Shield className="w-4 h-4 text-gray-500" />
                            </Button>
                            <AlertDialog open={deleteTarget?.id === u.id} onOpenChange={open => setDeleteTarget(open ? { type: 'user', id: u.id, name: u.name } : null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="حذف"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>حذف المستخدم</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف &quot;{u.name}&quot;؟</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map(u => (
                  <Card key={u.id} className="card-premium border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-9 w-9 ring-2 ring-emerald-50"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-semibold">{u.name[0]}</AvatarFallback></Avatar>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400" dir="ltr">{u.email}</p>
                          </div>
                        </div>
                        <Badge className={`badge-premium ${roleColors[u.role]}`}>{roleLabels[u.role]}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">{timeAgo(u.createdAt)}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" title="إرسال إشعار" onClick={() => { setNotifyUser(u as AppUser); setNotifyTitle(''); setNotifyMessage(''); }}><Bell className="w-4 h-4 text-amber-600" /></Button>
                          <Button variant="ghost" size="sm" title="تعديل الدور" onClick={() => { setEditUser(u); setEditRole(u.role); }}><Shield className="w-4 h-4" /></Button>
                          <AlertDialog open={deleteTarget?.id === u.id} onOpenChange={open => setDeleteTarget(open ? { type: 'user', id: u.id, name: u.name } : null)}>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm" title="حذف"><Trash2 className="w-4 h-4 text-red-400" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>حذف المستخدم</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد؟</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={handleDeleteUser} className="bg-red-600">حذف</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Edit Role Dialog */}
        <Dialog open={!!editUser} onOpenChange={open => { if (!open) setEditUser(null); }}>
          <DialogContent className="rounded-2xl">
            <DialogHeader><DialogTitle className="text-lg font-bold">تعديل دور المستخدم</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <p className="text-sm text-gray-600">المستخدم: <strong>{editUser?.name}</strong></p>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEEKER">باحث عن عمل</SelectItem>
                  <SelectItem value="COMPANY">مؤسسة</SelectItem>
                  <SelectItem value="ADMIN">مدير</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleUpdateRole} className="w-full h-11 bg-emerald-700 hover:bg-emerald-800">حفظ التغييرات</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Notification to a Single User Dialog */}
        <Dialog open={!!notifyUser} onOpenChange={open => { if (!notifying) setNotifyUser(open ? notifyUser : null); }}>
          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" />
                إرسال إشعار إلى {notifyUser?.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                سيصل الإشعار فوراً إلى المستخدم في صفحة التنبيهات الخاصة به.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="notify-title" className="text-sm font-medium text-gray-700">عنوان الإشعار</Label>
                <Input
                  id="notify-title"
                  placeholder="مثال: تحديث الحساب"
                  value={notifyTitle}
                  onChange={e => setNotifyTitle(e.target.value)}
                  className="h-11"
                  disabled={notifying}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notify-message" className="text-sm font-medium text-gray-700">نص الرسالة</Label>
                <Textarea
                  id="notify-message"
                  placeholder="اكتب نص الإشعار هنا..."
                  value={notifyMessage}
                  onChange={e => setNotifyMessage(e.target.value)}
                  rows={4}
                  disabled={notifying}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setNotifyUser(null)}
                  disabled={notifying}
                >
                  إلغاء
                </Button>
                <Button
                  className="flex-1 h-11 bg-amber-600 hover:bg-amber-700"
                  onClick={handleSendNotification}
                  disabled={notifying || !notifyTitle.trim() || !notifyMessage.trim()}
                >
                  {notifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                      جارٍ الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 ml-1" />
                      إرسال الإشعار
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     JOBS MANAGEMENT
  ════════════════════════════════════════════════════════════ */
  if (currentView === 'admin-jobs') {
    return (
      <div dir="rtl" className="page-transition min-h-screen" style={{ background: 'linear-gradient(180deg, #f7faf8 0%, #f1f5f4 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
          <Button variant="ghost" className="mb-5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => navigate('admin-dashboard')}>
            <ChevronLeft className="w-4 h-4 ml-1" /> العودة للوحة التحكم
          </Button>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="section-accent-bar" />
              إدارة الوظائف
            </h1>
            <p className="text-gray-500 text-sm mt-2 mr-3">مراجعة الوظائف المنشورة والتحكم في حالتها</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="بحث بالمنصب أو المؤسسة..." value={jobSearch} onChange={e => setJobSearch(e.target.value)} className="pr-10 h-11 bg-white border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20" />
            </div>
            <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 h-11 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">الكل</SelectItem>
                <SelectItem value="ACTIVE">نشطة</SelectItem>
                <SelectItem value="PENDING">قيد المراجعة</SelectItem>
                <SelectItem value="CLOSED">مغلقة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer-pro h-16 w-full" />)}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20">
              <div className="empty-state-circle w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Briefcase className="w-9 h-9 text-emerald-500" />
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-1">لا توجد وظائف</p>
              <p className="text-gray-400 text-sm">قد تظهر وظائف جديدة بمجرد نشر المؤسسات لها</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map(job => (
                <Card key={job.id} className="card-premium border-0">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-base">{job.position}</h3>
                          <Badge className={`badge-premium ${statusColors[job.status] || 'bg-gray-100'}`}>{statusLabels[job.status] || job.status}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.companyName}</span>
                          <span>·</span>
                          <span>{job._count?.applications || 0} متقدم</span>
                          <span>·</span>
                          <span>{job.views} مشاهدة</span>
                          <span>·</span>
                          <span>{timeAgo(job.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => setPreviewJob(job as Job)}
                        >
                          <Eye className="w-4 h-4 ml-1" /> معاينة
                        </Button>
                        {job.status === 'PENDING' && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateJobStatus(job.id, 'ACTIVE')}>
                            <CheckCircle2 className="w-4 h-4 ml-1" /> موافقة
                          </Button>
                        )}
                        {job.status === 'ACTIVE' && (
                          <Button size="sm" variant="outline" className="text-amber-600 border-amber-200" onClick={() => handleUpdateJobStatus(job.id, 'CLOSED')}>
                            <XCircle className="w-4 h-4 ml-1" /> إغلاق
                          </Button>
                        )}
                        {job.status === 'CLOSED' && (
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200" onClick={() => handleUpdateJobStatus(job.id, 'ACTIVE')}>
                            <CheckCircle2 className="w-4 h-4 ml-1" /> تفعيل
                          </Button>
                        )}
                        <AlertDialog open={deleteTarget?.id === job.id} onOpenChange={open => setDeleteTarget(open ? { type: 'job', id: job.id, name: job.position } : null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="حذف"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>حذف الوظيفة</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف &quot;{job.position}&quot;؟</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={handleDeleteJob} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Job Preview Dialog ── */}
        <Dialog open={!!previewJob} onOpenChange={open => { if (!open) setPreviewJob(null); }}>
          <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-700" />
                {previewJob?.position}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{previewJob?.companyName}</span>
              </DialogDescription>
            </DialogHeader>

            {previewJob && (
              <div className="space-y-4 overflow-y-auto pr-1 -mr-1">
                {/* Meta strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`badge-premium ${statusColors[previewJob.status] || 'bg-gray-100'}`}>
                    {statusLabels[previewJob.status] || previewJob.status}
                  </Badge>
                  <Badge className="badge-premium bg-emerald-50 text-emerald-700">{previewJob.activityType}</Badge>
                  <Badge className="badge-premium bg-amber-50 text-amber-700">
                    {previewJob.contractType === 'permanent' ? 'دائم' : previewJob.contractType === 'temporary' ? 'مؤقت' : 'تدريب'}
                  </Badge>
                  {previewJob.budget && (
                    <Badge className="badge-premium bg-slate-100 text-slate-700">{previewJob.budget}</Badge>
                  )}
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-2 text-center bg-emerald-50/40 rounded-xl p-3 border border-emerald-100">
                  <div>
                    <div className="premium-number text-xl font-extrabold text-emerald-700">{previewJob._count?.applications || 0}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">متقدم</div>
                  </div>
                  <div className="border-r border-l border-emerald-100">
                    <div className="premium-number text-xl font-extrabold text-emerald-700">{previewJob.views}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">مشاهدة</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-gray-700">{timeAgo(previewJob.createdAt)}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">النشر</div>
                  </div>
                </div>

                {/* Required skills */}
                {(() => {
                  const skills = parseSkillsArray(previewJob.requiredSkills);
                  return skills.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        المهارات المطلوبة
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((sk, i) => (
                          <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Description */}
                {previewJob.description && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">الوصف</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/60 rounded-xl p-3 border border-gray-100">
                      {previewJob.description}
                    </p>
                  </div>
                )}

                {/* Requirements */}
                {previewJob.requirements && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1.5">المتطلبات</p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50/60 rounded-xl p-3 border border-gray-100">
                      {previewJob.requirements}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {previewJob.status === 'PENDING' && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => { handleUpdateJobStatus(previewJob.id, 'ACTIVE'); setPreviewJob(null); }}
                    >
                      <CheckCircle2 className="w-4 h-4 ml-1" /> موافقة ونشر
                    </Button>
                  )}
                  {previewJob.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-600 border-amber-200"
                      onClick={() => { handleUpdateJobStatus(previewJob.id, 'CLOSED'); setPreviewJob(null); }}
                    >
                      <XCircle className="w-4 h-4 ml-1" /> إغلاق
                    </Button>
                  )}
                  {previewJob.status === 'CLOSED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-600 border-emerald-200"
                      onClick={() => { handleUpdateJobStatus(previewJob.id, 'ACTIVE'); setPreviewJob(null); }}
                    >
                      <CheckCircle2 className="w-4 h-4 ml-1" /> إعادة التفعيل
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="mr-auto" onClick={() => setPreviewJob(null)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     APPLICATIONS MANAGEMENT
  ════════════════════════════════════════════════════════════ */
  if (currentView === 'admin-applications') {
    return (
      <div dir="rtl" className="page-transition min-h-screen" style={{ background: 'linear-gradient(180deg, #f7faf8 0%, #f1f5f4 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
          <Button variant="ghost" className="mb-5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => navigate('admin-dashboard')}>
            <ChevronLeft className="w-4 h-4 ml-1" /> العودة للوحة التحكم
          </Button>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="section-accent-bar" />
              إدارة الطلبات
            </h1>
            <p className="text-gray-500 text-sm mt-2 mr-3">متابعة طلبات التوظيف واتخاذ القرار المناسب بشأنها</p>
          </div>

          <div className="flex gap-3 mb-6">
            <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
              <SelectTrigger className="w-40 h-11 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">الكل</SelectItem>
                <SelectItem value="PENDING">قيد المراجعة</SelectItem>
                <SelectItem value="ACCEPTED">مقبول</SelectItem>
                <SelectItem value="REJECTED">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer-pro h-16 w-full" />)}</div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-20">
              <div className="empty-state-circle w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <FileText className="w-9 h-9 text-emerald-500" />
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-1">لا توجد طلبات</p>
              <p className="text-gray-400 text-sm">عندما يقدم الباحثون عن وظائف، ستظهر طلباتهم هنا</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApps.map(app => (
                <Card key={app.id} className="card-premium border-0">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-base">{app.seeker?.name || 'مستخدم'}</h3>
                          <span className="text-gray-400 text-sm">←</span>
                          <span className="text-gray-600 font-medium">{app.job?.position || 'وظيفة'}</span>
                          <Badge className={`badge-premium ${statusColors[app.status] || 'bg-gray-100'}`}>{statusLabels[app.status] || app.status}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{app.job?.companyName}</span>
                          <span>·</span>
                          <span>{timeAgo(app.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => setApplicantDetails(app as AppApplication)}
                        >
                          <Eye className="w-4 h-4 ml-1" /> تفاصيل
                        </Button>
                        {app.status === 'PENDING' && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateAppStatus(app.id, 'ACCEPTED')}>
                              <CheckCircle2 className="w-4 h-4 ml-1" /> قبول
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleUpdateAppStatus(app.id, 'REJECTED')}>
                              <XCircle className="w-4 h-4 ml-1" /> رفض
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Applicant Details Dialog ── */}
        <Dialog open={!!applicantDetails} onOpenChange={open => { if (!open) setApplicantDetails(null); }}>
          <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-700" />
                {applicantDetails?.seeker?.name || 'مستخدم'}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                متقدم لوظيفة <strong className="text-gray-700">{applicantDetails?.job?.position}</strong>
                {applicantDetails?.job?.companyName ? ` في ${applicantDetails.job.companyName}` : ''}
              </DialogDescription>
            </DialogHeader>

            {applicantDetails && (
              <div className="space-y-4 overflow-y-auto pr-1 -mr-1">
                {/* Status + meta */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`badge-premium ${statusColors[applicantDetails.status] || 'bg-gray-100'}`}>
                    {statusLabels[applicantDetails.status] || applicantDetails.status}
                  </Badge>
                  <span className="text-xs text-gray-500">قُدّم {timeAgo(applicantDetails.createdAt)}</span>
                  {applicantDetails.rating != null && (
                    <Badge className="badge-premium bg-emerald-50 text-emerald-700">تقييم: {applicantDetails.rating}/5</Badge>
                  )}
                </div>

                {(() => {
                  const resume = applicantDetails.seeker?.resume;
                  if (!resume) {
                    return (
                      <div className="text-center py-8 bg-gray-50/60 rounded-xl border border-gray-100">
                        <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">لم يُكمل المتقدم ملء السيرة الذاتية بعد</p>
                      </div>
                    );
                  }
                  const skills = parseSkillsArray(resume.skills);
                  return (
                    <>
                      {/* Resume basics */}
                      <div className="grid grid-cols-2 gap-2 bg-emerald-50/40 rounded-xl p-3 border border-emerald-100">
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="w-4 h-4 text-emerald-700" />
                          <div>
                            <div className="text-[11px] text-gray-500">المؤهل</div>
                            <div className="font-semibold text-gray-800">{resume.education || '—'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-emerald-700" />
                          <div>
                            <div className="text-[11px] text-gray-500">العمر</div>
                            <div className="font-semibold text-gray-800">{resume.age || '—'} سنة</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="w-4 h-4 text-emerald-700" />
                          <div>
                            <div className="text-[11px] text-gray-500">نظام العمل</div>
                            <div className="font-semibold text-gray-800">
                              {resume.workSystem === 'fulltime' ? 'دوام كامل' : resume.workSystem === 'parttime' ? 'دوام جزئي' : 'عن بُعد'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Activity className="w-4 h-4 text-emerald-700" />
                          <div>
                            <div className="text-[11px] text-gray-500">الحالة</div>
                            <div className="font-semibold text-gray-800">
                              {resume.currentlyWorking ? 'يعمل حالياً' : 'غير عامل'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Professional interest */}
                      {resume.professionalInterest && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">الاهتمام المهني</p>
                          <p className="text-sm text-gray-700 bg-amber-50/50 rounded-lg p-2.5 border border-amber-100">{resume.professionalInterest}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {skills.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            المهارات ({skills.length})
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {skills.map((sk, i) => (
                              <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Behavioral profile */}
                      <div className="bg-gray-50/60 rounded-xl p-3 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 mb-2">الملف السلوكي</p>
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">أسلوب العمل:</span>
                            <span className="font-medium text-gray-800">
                              {resume.workStyle === 'individual' ? 'فردي' : 'جماعي'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">التفضيل:</span>
                            <span className="font-medium text-gray-800">
                              {resume.preference === 'stability' ? 'الاستقرار' : 'التحدي'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">التحمل:</span>
                            <span className="font-medium text-gray-800">
                              {resume.pressureTolerance === 'strong' ? 'قوي' : resume.pressureTolerance === 'medium' ? 'متوسط' : 'ضعيف'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">يقبل التدريب:</span>
                            <span className="font-medium text-gray-800">{resume.acceptTraining ? 'نعم' : 'لا'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">يقبل المؤقت:</span>
                            <span className="font-medium text-gray-800">{resume.acceptTemporary ? 'نعم' : 'لا'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">يقبل العمل الميداني:</span>
                            <span className="font-medium text-gray-800">{resume.acceptFieldWork ? 'نعم' : 'لا'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Admin notes */}
                      {applicantDetails.notes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1.5">ملاحظات إدارية</p>
                          <p className="text-sm text-gray-700 whitespace-pre-line bg-yellow-50/60 rounded-lg p-2.5 border border-yellow-100">
                            {applicantDetails.notes}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Action buttons */}
                {applicantDetails.status === 'PENDING' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => { handleUpdateAppStatus(applicantDetails.id, 'ACCEPTED'); setApplicantDetails(null); }}
                    >
                      <CheckCircle2 className="w-4 h-4 ml-1" /> قبول
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200"
                      onClick={() => { handleUpdateAppStatus(applicantDetails.id, 'REJECTED'); setApplicantDetails(null); }}
                    >
                      <XCircle className="w-4 h-4 ml-1" /> رفض
                    </Button>
                    <Button variant="ghost" size="sm" className="mr-auto" onClick={() => setApplicantDetails(null)}>
                      إغلاق
                    </Button>
                  </div>
                )}
                {applicantDetails.status !== 'PENDING' && (
                  <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                    <Button variant="ghost" size="sm" onClick={() => setApplicantDetails(null)}>
                      إغلاق
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}