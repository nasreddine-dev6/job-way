'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Filter,
  Briefcase,
  Building2,
  Users,
  Eye,
  X,
  SlidersHorizontal,
  MapPin,
  Clock,
  BookmarkPlus,
} from 'lucide-react';
import type { Job } from '@/lib/types';
import { ACTIVITY_TYPES } from '@/lib/types';
import { toast } from 'sonner';

/* Map interest categories (from landing page) to activity types */
const INTEREST_TO_ACTIVITY: Record<string, string> = {
  education: 'التعليم والتدريب',
  commerce: 'التجارة والأعمال',
  health: 'الصحة والطب',
  services: 'الخدمات',
  management: 'الإدارة',
  technology: 'تكنولوجيا المعلومات',
  creativity: 'الإبداع والتصميم',
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 30) return `منذ ${days} أيام`;
  return `منذ ${Math.floor(days / 30)} شهر`;
}

function parseSkills(skills: unknown): string[] {
  if (Array.isArray(skills)) return skills;
  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return skills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

const hasActiveFilters = (activityType: string, contractType: string, search: string) =>
  activityType !== 'all' || contractType !== 'all' || search.trim().length > 0;

export default function JobListings() {
  const { searchQuery, setSearchQuery, navigate, viewParams } = useAppStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [activityType, setActivityType] = useState('all');
  const [contractType, setContractType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'ACTIVE');
      if (search.trim()) params.set('search', search.trim());
      if (activityType !== 'all') params.set('activityType', activityType);
      if (contractType !== 'all') params.set('contractType', contractType);
      params.set('sortBy', sortBy);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      } else {
        setJobs([]);
        toast.error('فشل تحميل الوظائف');
      }
    } catch {
      setJobs([]);
      toast.error('حدث خطأ أثناء تحميل الوظائف');
    } finally {
      setLoading(false);
    }
  }, [search, activityType, contractType, sortBy]);

  // Debounced search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchJobs();
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [fetchJobs]);

  // Sync searchQuery from store on mount
  useEffect(() => {
    if (searchQuery) {
      setSearch(searchQuery);
    }
  }, []); // run once on mount

  // Apply interest filter coming from landing page categories
  useEffect(() => {
    if (viewParams.interest) {
      const mapped = INTEREST_TO_ACTIVITY[viewParams.interest];
      if (mapped) {
        setActivityType(mapped);
      }
    }
  }, [viewParams.interest]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      fetchJobs();
    }
  };

  const filtersActive = hasActiveFilters(activityType, contractType, search);

  const resetFilters = () => {
    setSearch('');
    setSearchQuery('');
    setActivityType('all');
    setContractType('all');
    setSortBy('newest');
    setShowFilters(false);
    toast.success('تم إعادة تعيين التصفية');
  };

  return (
    <div dir="rtl" className="page-transition min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              الوظائف المتاحة
            </h1>
            {!loading && jobs.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-3 py-0.5 text-sm"
              >
                {jobs.length} وظيفة
              </Badge>
            )}
          </div>
          <p className="text-gray-500 text-sm sm:text-base">
            ابحث عن الوظيفة المناسبة لك
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSearchQuery(e.target.value);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="ابحث عن وظيفة..."
              className="pr-12 pl-10 h-12 text-base bg-white border-gray-200 rounded-xl focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all shadow-sm"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setSearchQuery('');
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-12 px-4 rounded-xl border-2 transition-all shadow-sm ${
              showFilters || filtersActive
                ? 'bg-emerald-50 border-emerald-400 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            aria-label="فتح التصفية"
          >
            <SlidersHorizontal className="w-5 h-5 ml-2" />
            <span className="hidden sm:inline font-medium">تصفية</span>
            {filtersActive && (
              <span className="mr-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="mb-6 border border-emerald-200 bg-white shadow-md rounded-xl overflow-hidden">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                  <Filter className="w-4 h-4" />
                  تصفية النتائج
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-xs"
                >
                  <X className="w-3.5 h-3.5 ml-1" />
                  إعادة تعيين
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                {/* Activity Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    نوع النشاط
                  </label>
                  <Select
                    value={activityType}
                    onValueChange={(val) => setActivityType(val)}
                  >
                    <SelectTrigger className="w-full bg-white rounded-lg border-gray-200 h-10">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contract Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    نوع العقد
                  </label>
                  <Select
                    value={contractType}
                    onValueChange={(val) => setContractType(val)}
                  >
                    <SelectTrigger className="w-full bg-white rounded-lg border-gray-200 h-10">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="permanent">دائم</SelectItem>
                      <SelectItem value="temporary">مؤقت</SelectItem>
                      <SelectItem value="training">تدريب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    الترتيب
                  </label>
                  <Select
                    value={sortBy}
                    onValueChange={(val) => setSortBy(val)}
                  >
                    <SelectTrigger className="w-full bg-white rounded-lg border-gray-200 h-10">
                      <SelectValue placeholder="الأحدث" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">الأحدث</SelectItem>
                      <SelectItem value="oldest">الأقدم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <Skeleton className="h-3.5 w-16 rounded" />
                    <div className="flex gap-4">
                      <Skeleton className="h-3.5 w-14 rounded" />
                      <Skeleton className="h-3.5 w-14 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <Briefcase className="w-9 h-9 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">لا توجد نتائج</h3>
            <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
              جرب تغيير معايير البحث أو التصفية للعثور على وظائف أخرى
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-xl border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-all"
              onClick={resetFilters}
            >
              إعادة تعيين التصفية
            </Button>
          </div>
        )}

        {/* Job Cards Grid */}
        {!loading && jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {jobs.map((job) => {
              const skills = parseSkills(job.requiredSkills);
              return (
                <Card
                  key={job.id}
                  className="job-card-hover bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => navigate('job-detail', { id: job.id })}
                >
                  <CardContent className="p-5 flex flex-col gap-3.5">
                    {/* Position */}
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200 leading-relaxed line-clamp-2">
                      {job.position}
                    </h3>

                    {/* Company */}
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Building2 className="w-4 h-4 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{job.companyName}</span>
                    </div>

                    {/* Activity & Contract Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-600 text-xs font-medium border-0"
                      >
                        {job.activityType}
                      </Badge>
                      <Badge
                        className={`text-xs font-medium border-0 ${contractColors[job.contractType] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {contractLabels[job.contractType] || job.contractType}
                      </Badge>
                    </div>

                    {/* Budget */}
                    {job.budget && (
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <BookmarkPlus className="w-4 h-4 text-emerald-500" />
                        {job.budget}
                      </div>
                    )}

                    {/* Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {skills.slice(0, 3).map((skill: string) => (
                          <span
                            key={skill}
                            className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full border border-emerald-100"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 3 && (
                          <span className="inline-block bg-gray-50 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
                            +{skills.length - 3} أخرى
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100 mt-auto">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo(job.createdAt)}
                      </span>
                      <div className="flex items-center gap-3.5">
                        <span className="flex items-center gap-1" title="المشاهدات">
                          <Eye className="w-3.5 h-3.5" />
                          {job.views}
                        </span>
                        <span className="flex items-center gap-1" title="المتقدمون">
                          <Users className="w-3.5 h-3.5" />
                          {job._count?.applications || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}