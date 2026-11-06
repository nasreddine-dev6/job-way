'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Edit, Save, Building2, Plus } from 'lucide-react';
import { normalizeResume } from '@/lib/types';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Label maps                                                         */
/* ------------------------------------------------------------------ */
const roleLabels: Record<string, string> = {
  ADMIN: 'مدير النظام',
  SEEKER: 'باحث عن عمل',
  COMPANY: 'شركة',
};

const workStyleLabels: Record<string, string> = {
  individual: 'فردي',
  group: 'جماعي',
};

const workSystemLabels: Record<string, string> = {
  fulltime: 'دوام كامل',
  parttime: 'دوام جزئي',
  remote: 'عن بُعد',
};

const preferenceLabels: Record<string, string> = {
  stability: 'الاستقرار',
  challenge: 'التحدي',
};

const pressureLabels: Record<string, string> = {
  strong: 'قوي',
  medium: 'متوسط',
  weak: 'ضعيف',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function ProfilePage() {
  const { user, setUser, navigate } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const resume = normalizeResume(user.resume);
  const company = user.company;

  function startEdit() {
    setEditName(user.name);
    setEditPhone(user.phone || '');
    setEditing(true);
  }

  async function handleSave() {
    if (!editName.trim()) {
      toast.error('يرجى إدخال الاسم');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: editName.trim(), phone: editPhone.trim() }),
      });
      if (!res.ok) throw new Error('فشل في تحديث البيانات');
      const data = await res.json();
      if (!data.user) throw new Error('استجابة غير صالحة');
      setUser(data.user);
      setEditing(false);
      toast.success('تم تحديث البيانات بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء تحديث البيانات');
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditing(false);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-emerald-600" />
            الملف الشخصي
          </h1>
          {!editing ? (
            <Button variant="outline" size="sm" className="gap-2" onClick={startEdit}>
              <Edit className="w-4 h-4" />
              تعديل
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEdit}
                disabled={saving}
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                حفظ
              </Button>
            </div>
          )}
        </div>

        {/* User Info Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar */}
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-2xl font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 w-full space-y-4 text-center sm:text-right">
                {/* Name */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">الاسم</Label>
                  {editing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-xs"
                    />
                  ) : (
                    <p className="text-lg font-bold">{user.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">البريد الإلكتروني</Label>
                  <div className="flex items-center gap-2 justify-center sm:justify-start text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">رقم الهاتف</Label>
                  {editing ? (
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="أدخل رقم الهاتف"
                      className="max-w-xs"
                    />
                  ) : (
                    <div className="flex items-center gap-2 justify-center sm:justify-start text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{user.phone || 'غير محدد'}</span>
                    </div>
                  )}
                </div>

                {/* Role & Join Date */}
                <div className="flex items-center gap-4 justify-center sm:justify-start pt-2">
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    {roleLabels[user.role] || user.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    انضم في {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seeker Resume Summary */}
        {user.role === 'SEEKER' && resume && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-600" />
                ملخص السيرة الذاتية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">الاسم الكامل</p>
                  <p className="text-sm font-medium">{resume.fullName}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">العمر</p>
                  <p className="text-sm font-medium">{resume.age} سنة</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">المستوى التعليمي</p>
                  <p className="text-sm font-medium">{resume.education}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">نمط العمل</p>
                  <p className="text-sm font-medium">{workStyleLabels[resume.workStyle]}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">نظام العمل</p>
                  <p className="text-sm font-medium">{workSystemLabels[resume.workSystem]}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">التفضيل</p>
                  <p className="text-sm font-medium">{preferenceLabels[resume.preference]}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">تحمل الضغط</p>
                  <p className="text-sm font-medium">{pressureLabels[resume.pressureTolerance]}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">يعمل حالياً</p>
                  <p className="text-sm font-medium">{resume.currentlyWorking ? 'نعم' : 'لا'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">الميول المهني</p>
                  <p className="text-sm font-medium">{resume.professionalInterest}</p>
                </div>
              </div>

              {/* Skills */}
              {resume.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">المهارات</p>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Readiness */}
              <div>
                <p className="text-sm font-medium mb-2">الاستعدادات</p>
                <div className="flex flex-wrap gap-2">
                  {resume.acceptTraining && (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
                      مستعد للتدريب
                    </Badge>
                  )}
                  {resume.acceptTemporary && (
                    <Badge variant="outline" className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                      مستعد لعمل مؤقت
                    </Badge>
                  )}
                  {resume.acceptFieldWork && (
                    <Badge variant="outline" className="border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-400">
                      مستعد لعمل ميداني
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div className="text-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate('seeker-resume')}
                >
                  <Edit className="w-4 h-4" />
                  تعديل السيرة الذاتية
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seeker No Resume */}
        {user.role === 'SEEKER' && !resume && (
          <Card className="text-center">
            <CardContent className="py-8 space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
              <p className="text-muted-foreground">لم يتم إنشاء السيرة الذاتية بعد</p>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={() => navigate('seeker-resume')}
              >
                <Plus className="w-4 h-4" />
                إنشاء سيرة ذاتية
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Company Info Card */}
        {user.role === 'COMPANY' && company && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                معلومات الشركة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">اسم الشركة</p>
                  <p className="text-sm font-medium">{company.name}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">نوع النشاط</p>
                  <p className="text-sm font-medium">{company.activityType}</p>
                </div>
              </div>
              {company.description && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">الوصف</p>
                  <p className="text-sm">{company.description}</p>
                </div>
              )}
              {company.website && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">الموقع الإلكتروني</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">{company.website}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}