'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import type { ViewName, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  Bell,
  MessageSquare,
  LogOut,
  User,
  Settings,
  Briefcase,
  Shield,
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';

/* ─── Constants ─────────────────────────────────────────────── */

const ROLE_LABELS: Record<UserRole, string> = {
  SEEKER: 'باحث عن عمل',
  COMPANY: 'مؤسسة',
  ADMIN: 'مدير النظام',
};

const ROLE_COLORS: Record<UserRole, string> = {
  SEEKER: 'bg-emerald-100 text-emerald-700',
  COMPANY: 'bg-amber-100 text-amber-700',
  ADMIN: 'bg-purple-100 text-purple-700',
};

interface MenuItem {
  label: string;
  view: ViewName;
  icon: React.ReactNode;
}

function getMenuItems(role: UserRole): MenuItem[] {
  switch (role) {
    case 'SEEKER':
      return [
        { label: 'لوحة التحكم', view: 'seeker-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'السيرة الذاتية', view: 'seeker-resume', icon: <FileText className="h-4 w-4" /> },
        { label: 'طلباتي', view: 'seeker-applications', icon: <ClipboardList className="h-4 w-4" /> },
        { label: 'الملف الشخصي', view: 'profile', icon: <User className="h-4 w-4" /> },
      ];
    case 'COMPANY':
      return [
        { label: 'لوحة التحكم', view: 'company-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'نشر وظيفة', view: 'company-post-job', icon: <Briefcase className="h-4 w-4" /> },
        { label: 'إدارة الوظائف', view: 'company-manage-jobs', icon: <Settings className="h-4 w-4" /> },
        { label: 'المتقدمين', view: 'company-applicants', icon: <Users className="h-4 w-4" /> },
        { label: 'الملف الشخصي', view: 'profile', icon: <User className="h-4 w-4" /> },
      ];
    case 'ADMIN':
      return [
        { label: 'لوحة التحكم', view: 'admin-dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'إدارة المستخدمين', view: 'admin-users', icon: <Shield className="h-4 w-4" /> },
        { label: 'إدارة الوظائف', view: 'admin-jobs', icon: <Briefcase className="h-4 w-4" /> },
        { label: 'إدارة الطلبات', view: 'admin-applications', icon: <ClipboardList className="h-4 w-4" /> },
      ];
  }
}

/* ─── Component ─────────────────────────────────────────────── */

export default function Header() {
  const { user, setUser, navigate, unreadCount } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {
      /* silent — clear local state regardless */
    }
    setUser(null);
    navigate('landing');
    toast.success('تم تسجيل الخروج بنجاح');
  };

  const navLinks = [
    { label: 'الرئيسية', view: 'landing' as ViewName },
    { label: 'الوظائف', view: 'jobs' as ViewName },
    { label: 'عن المنصة', view: 'landing' as ViewName },
  ];

  const menuItems = user ? getMenuItems(user.role) : [];

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return parts[0].slice(0, 2);
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-white/20 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/70 transition-all duration-300 ${scrolled ? 'header-scrolled' : ''}`}
      style={scrolled ? { boxShadow: '0 1px 2px rgba(20, 39, 45, 0.04), 0 4px 16px rgba(20, 39, 45, 0.06)' } : undefined}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── RTL: Logo on the RIGHT ── */}
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2 select-none group"
          aria-label="الصفحة الرئيسية"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden shadow-md transition-transform group-hover:scale-105"
            style={{ boxShadow: '0 6px 14px rgba(4, 120, 87, 0.25), inset 0 1px 0 rgba(255,255,255,0.25)' }}
          >
            <img src="/logo.png" alt="JobWay" className="w-full h-full object-cover" />
          </span>
          <span className="text-2xl font-extrabold gradient-text tracking-tight">
            JobWay
          </span>
        </button>

        {/* ── Center Nav Links (desktop, non-logged-in) ── */}
        {!user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.view)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200"
              >
                {link.label}
              </button>
            ))}
          </nav>
        )}

        {/* ── Left: Auth buttons (desktop, non-logged-in) ── */}
        <div className="hidden md:flex items-center gap-2">
          {!user ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate('login')}
                className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium transition-colors duration-200"
              >
                تسجيل الدخول
              </Button>
              <Button
                onClick={() => navigate('register')}
                className="bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                style={{ boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)' }}
              >
                إنشاء حساب
              </Button>
            </>
          ) : (
            <>
              {/* Notification Bell */}
              <button
                onClick={() => navigate('notifications')}
                className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
                aria-label="الإشعارات"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Messages Icon */}
              <button
                onClick={() => navigate('messages')}
                className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200"
                aria-label="الرسائل"
              >
                <MessageSquare className="h-5 w-5" />
              </button>

              {/* Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="mr-1 flex items-center gap-2 rounded-full p-0.5 ring-1 ring-slate-200 hover:ring-emerald-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-xl p-2">
                  {/* User Info Header */}
                  <div className="px-3 py-2.5">
                    <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
                      {user.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 truncate">{user.email}</p>
                    <Badge
                      variant="secondary"
                      className={`mt-2 text-[11px] font-medium ${ROLE_COLORS[user.role]}`}
                    >
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />

                  {/* Menu Items */}
                  {menuItems.map((item) => (
                    <DropdownMenuItem
                      key={item.view}
                      onClick={() => navigate(item.view)}
                      className="cursor-pointer flex items-center justify-end gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors duration-150"
                    >
                      <span>{item.label}</span>
                      <span className="text-slate-400">{item.icon}</span>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer flex items-center justify-end gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-150"
                  >
                    <span>تسجيل الخروج</span>
                    <LogOut className="h-4 w-4 text-red-400" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <div className="flex md:hidden items-center gap-1">
          {/* Mobile notification badge */}
          {user && unreadCount > 0 && (
            <button
              onClick={() => {
                navigate('notifications');
                closeMobile();
              }}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors duration-200"
              aria-label="الإشعارات"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -left-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </button>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors duration-200"
                aria-label="فتح القائمة"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 overflow-y-auto p-0">
              <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>

              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <button
                    onClick={() => {
                      navigate('landing');
                      closeMobile();
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden shadow"
                    >
                      <img src="/logo.png" alt="JobWay" className="w-full h-full object-cover" />
                    </span>
                    <span className="text-xl font-extrabold gradient-text">JobWay</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {/* ── User Info (logged in) ── */}
                  {user && (
                    <div className="mb-4 rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm font-bold">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                          <Badge
                            variant="secondary"
                            className={`mt-1 text-[11px] font-medium ${ROLE_COLORS[user.role]}`}
                          >
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Navigation Links ── */}
                  <nav className="flex flex-col gap-0.5">
                    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      التنقل
                    </p>
                    {navLinks.map((link) => (
                      <button
                        key={link.label}
                        onClick={() => {
                          navigate(link.view);
                          closeMobile();
                        }}
                        className="flex items-center justify-end rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                      >
                        {link.label}
                      </button>
                    ))}
                  </nav>

                  {/* ── Role-specific Items (logged in) ── */}
                  {user && (
                    <>
                      <Separator className="my-4" />
                      <nav className="flex flex-col gap-0.5">
                        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          القائمة
                        </p>
                        {menuItems.map((item) => (
                          <button
                            key={item.view}
                            onClick={() => {
                              navigate(item.view);
                              closeMobile();
                            }}
                            className="flex items-center justify-end gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                          >
                            <span>{item.label}</span>
                            <span className="text-slate-400">{item.icon}</span>
                          </button>
                        ))}

                        {/* Messages & Notifications shortcuts */}
                        <button
                          onClick={() => {
                            navigate('messages');
                            closeMobile();
                          }}
                          className="flex items-center justify-end gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                        >
                          <span>الرسائل</span>
                          <MessageSquare className="h-4 w-4 text-slate-400" />
                        </button>
                        <button
                          onClick={() => {
                            navigate('notifications');
                            closeMobile();
                          }}
                          className="flex items-center justify-end gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors duration-150"
                        >
                          <span>الإشعارات</span>
                          <Bell className="h-4 w-4 text-slate-400" />
                        </button>
                      </nav>
                    </>
                  )}
                </div>

                {/* ── Mobile Footer Actions ── */}
                <div className="border-t border-slate-100 p-4">
                  {!user ? (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigate('login');
                          closeMobile();
                        }}
                        className="w-full font-medium"
                      >
                        تسجيل الدخول
                      </Button>
                      <Button
                        onClick={() => {
                          navigate('register');
                          closeMobile();
                        }}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm transition-colors duration-200"
                        style={{ boxShadow: '0 4px 12px rgba(4, 120, 87, 0.25)' }}
                      >
                        إنشاء حساب
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout();
                        closeMobile();
                      }}
                      className="w-full font-medium text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors duration-200"
                    >
                      <LogOut className="h-4 w-4 ml-2" />
                      تسجيل الخروج
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}