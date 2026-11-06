'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Building2,
  UserSearch,
  Shield,
  CheckCircle2,
  ShieldCheck,
  Fingerprint,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import type { UserRole, User, ViewName } from '@/lib/types';

export default function AuthForms() {
  const { currentView, setUser, navigate } = useAppStore();

  if (currentView === 'login') return <LoginForm setUser={setUser} navigate={navigate} />;
  if (currentView === 'register') return <RegisterForm setUser={setUser} navigate={navigate} />;
  return null;
}

/* ────────────────────────────── Login Form ────────────────────────────── */

interface LoginFormProps {
  setUser: (user: User | null) => void;
  navigate: (view: ViewName, params?: Record<string, string>) => void;
}

function LoginForm({ setUser, navigate }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { role: 'ADMIN', label: 'مدير', email: 'admin@jobway.demo', password: 'admin123', icon: Shield, iconClass: 'stat-icon-plum' },
    { role: 'SEEKER', label: 'باحث', email: 'seeker@jobway.demo', password: 'seeker123', icon: UserSearch, iconClass: 'stat-icon-emerald' },
    { role: 'COMPANY', label: 'جهة توظيف', email: 'company@jobway.demo', password: 'company123', icon: Building2, iconClass: 'stat-icon-amber' },
  ];

  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء تسجيل الدخول');

      setUser(data.user);
      toast.success(`مرحباً ${data.user.name}!`);

      const dashboards: Record<string, string> = {
        ADMIN: 'admin-dashboard',
        SEEKER: 'seeker-dashboard',
        COMPANY: 'company-dashboard',
      };
      navigate(dashboards[data.user.role] || 'landing');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  const quickLogin = (acc: typeof demoAccounts[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    handleLogin(acc.email, acc.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" dir="rtl"
      style={{ background: 'linear-gradient(135deg, #f7faf8 0%, #ecfdf5 50%, #f7faf8 100%)' }}
    >
      {/* Background decorative blobs */}
      <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-emerald-200/30 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-amber-200/25 rounded-full blur-[110px] translate-y-1/4 -translate-x-1/4" />

      <Card className="relative w-full max-w-md page-transition overflow-hidden rounded-2xl border-0"
        style={{
          boxShadow: '0 1px 3px rgba(20, 39, 45, 0.04), 0 14px 36px rgba(20, 39, 45, 0.10), 0 0 0 1px rgba(4, 120, 87, 0.08)',
        }}
      >
        {/* Top accent strip */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #065f46, #047857, #0d9488, #d97706)' }} />

        <CardHeader className="text-center pb-2 pt-6">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl overflow-hidden shadow-md"
              style={{ boxShadow: '0 6px 14px rgba(4, 120, 87, 0.25), inset 0 1px 0 rgba(255,255,255,0.25)' }}
            >
              <img src="/logo.png" alt="JobWay" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-extrabold gradient-text tracking-tight">JobWay</h1>
          </div>
          <CardTitle className="text-xl font-bold text-slate-800">تسجيل الدخول</CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            أدخل بياناتك للوصول إلى حسابك
          </CardDescription>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>تشفير آمن للبيانات</span>
            </div>
            <div className="w-px h-3.5 bg-slate-200" />
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>حماية الخصوصية</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-slate-700 text-sm font-medium">
                البريد الإلكتروني
              </Label>
              <div className="relative group">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 h-11 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm transition-all"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-slate-700 text-sm font-medium">
                كلمة المرور
              </Label>
              <div className="relative group">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10 h-11 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-11 text-base font-semibold transition-all cursor-pointer"
              style={{ boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)' }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  جاري تسجيل الدخول…
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center text-sm text-slate-500">
            ليس لديك حساب؟{' '}
            <button
              onClick={() => navigate('register')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold underline-offset-4 hover:underline cursor-pointer transition-colors"
            >
              سجل الآن
            </button>
          </div>

          {/* ─── Demo Accounts (quick preview) ─── */}
          <div className="mt-6 pt-5 border-t border-dashed border-slate-200">
            <div className="flex items-center justify-center gap-1.5 mb-3 text-xs text-slate-600 font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>حسابات معاينة سريعة — نقرة واحدة</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => quickLogin(acc)}
                    disabled={loading}
                    className="flex flex-col items-center gap-1.5 rounded-xl border bg-white px-2 py-3 text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-slate-200 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5"
                    style={{ boxShadow: '0 1px 2px rgba(20, 39, 45, 0.04), 0 2px 6px rgba(20, 39, 45, 0.03)' }}
                    title={`دخول كـ ${acc.label} — ${acc.email}`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${acc.iconClass}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{acc.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[11px] text-slate-400 mt-2.5 leading-relaxed">
              للمعاينة فقط — استخدم الأزرار للدخول الفوري لكل لوحة تحكم
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ──────────────────────────── Register Form ──────────────────────────── */

interface RegisterFormProps {
  setUser: (user: User | null) => void;
  navigate: (view: ViewName, params?: Record<string, string>) => void;
}

function RegisterForm({ setUser, navigate }: RegisterFormProps) {
  const [role, setRole] = useState<UserRole>('SEEKER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!name.trim()) {
      toast.error('يرجى إدخال الاسم الكامل');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('يرجى إدخال بريد إلكتروني صحيح');
      return false;
    }
    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email,
          password,
          name,
          role,
          phone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء إنشاء الحساب');

      setUser(data.user);
      toast.success('تم إنشاء الحساب بنجاح!');

      if (role === 'SEEKER') {
        navigate('seeker-resume');
      } else {
        navigate('company-dashboard');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" dir="rtl"
      style={{ background: 'linear-gradient(135deg, #f7faf8 0%, #ecfdf5 50%, #f7faf8 100%)' }}
    >
      {/* Background decorative blobs */}
      <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-emerald-200/30 rounded-full blur-[120px] -translate-y-1/4 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-amber-200/25 rounded-full blur-[110px] translate-y-1/4 -translate-x-1/4" />

      <Card className="relative w-full max-w-md page-transition overflow-hidden rounded-2xl border-0"
        style={{
          boxShadow: '0 1px 3px rgba(20, 39, 45, 0.04), 0 14px 36px rgba(20, 39, 45, 0.10), 0 0 0 1px rgba(4, 120, 87, 0.08)',
        }}
      >
        {/* Top accent strip */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #065f46, #047857, #0d9488, #d97706)' }} />

        <CardHeader className="text-center pb-2 pt-6">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl overflow-hidden shadow-md"
              style={{ boxShadow: '0 6px 14px rgba(4, 120, 87, 0.25), inset 0 1px 0 rgba(255,255,255,0.25)' }}
            >
              <img src="/logo.png" alt="JobWay" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-extrabold gradient-text tracking-tight">JobWay</h1>
          </div>
          <CardTitle className="text-xl font-bold text-slate-800">إنشاء حساب جديد</CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            اختر نوع الحساب وأدخل بياناتك
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Role Selector Tabs */}
          <Tabs
            value={role}
            onValueChange={(v) => setRole(v as UserRole)}
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-100/80 p-1 rounded-xl">
              <TabsTrigger
                value="SEEKER"
                className="cursor-pointer gap-2 rounded-lg text-sm font-medium data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                style={{ boxShadow: undefined }}
              >
                <UserSearch className="h-4 w-4" />
                باحث عن عمل
              </TabsTrigger>
              <TabsTrigger
                value="COMPANY"
                className="cursor-pointer gap-2 rounded-lg text-sm font-medium data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                style={{ boxShadow: undefined }}
              >
                <Building2 className="h-4 w-4" />
                مؤسسة
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="reg-name" className="text-slate-700 text-sm font-medium">
                الاسم الكامل
              </Label>
              <div className="relative group">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder={role === 'SEEKER' ? 'أدخل اسمك الكامل' : 'اسم المؤسسة'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pr-10 h-11 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-slate-700 text-sm font-medium">
                البريد الإلكتروني
              </Label>
              <div className="relative group">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 h-11 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm transition-all"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            {/* Phone (optional) */}
            <div className="space-y-2">
              <Label htmlFor="reg-phone" className="text-slate-700 text-sm font-medium">
                رقم الهاتف
                <span className="text-slate-400 font-normal mr-1">(اختياري)</span>
              </Label>
              <div className="relative group">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pr-10 h-11 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-slate-700 text-sm font-medium">
                كلمة المرور
              </Label>
              <div className="relative group">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="6 أحرف على الأقل"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10 h-11 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="reg-confirm" className="text-slate-700 text-sm font-medium">
                تأكيد كلمة المرور
              </Label>
              <div className="relative group">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-600 transition-colors">
                  <Shield className="h-4 w-4" />
                </div>
                <Input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="أعد إدخال كلمة المرور"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10 pl-10 h-11 rounded-lg border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white/80 backdrop-blur-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-700 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl h-11 text-base font-semibold transition-all cursor-pointer"
              style={{ boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25), inset 0 1px 0 rgba(255,255,255,0.15)' }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  جاري إنشاء الحساب…
                </span>
              ) : role === 'SEEKER' ? (
                'سجل كباحث عن عمل'
              ) : (
                'سجل كمؤسسة'
              )}
            </Button>

            {/* Terms agreement text */}
            <p className="text-center text-xs text-gray-400 leading-relaxed">
              بالتسجيل أنت توافق على شروط الاستخدام وسياسة الخصوصية
            </p>
          </form>

          {/* Login link */}
          <div className="mt-5 text-center text-sm text-slate-500">
            لديك حساب بالفعل؟{' '}
            <button
              onClick={() => navigate('login')}
              className="text-emerald-700 hover:text-emerald-800 font-semibold underline-offset-4 hover:underline cursor-pointer transition-colors"
            >
              سجل الدخول
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}