'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { X, Bell, Briefcase, UserPlus, MessageSquare, CheckCircle2, XCircle, Clock, Trash2, CheckCheck } from 'lucide-react';
import type { AppNotification } from '@/lib/types';

const typeIcons: Record<string, any> = {
  JOB_NEW: Briefcase,
  NEW_APPLICANT: UserPlus,
  MESSAGE: MessageSquare,
  APPLICATION_UPDATE: CheckCircle2,
  SYSTEM: Bell,
};

const typeColors: Record<string, string> = {
  JOB_NEW: 'bg-emerald-100 text-emerald-600',
  NEW_APPLICANT: 'bg-blue-100 text-blue-600',
  MESSAGE: 'bg-purple-100 text-purple-600',
  APPLICATION_UPDATE: 'bg-amber-100 text-amber-600',
  SYSTEM: 'bg-gray-100 text-gray-600',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

export default function NotificationsPanel() {
  const { user, navigate, notifications, setNotifications, markAsRead, unreadCount } = useAppStore();

  useEffect(() => {
    if (!user) return;
    fetch(`/api/notifications?userId=${user.id}`)
      .then(r => r.json())
      .then(data => setNotifications(data.notifications || []));
  }, [user, setNotifications]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true, userId: user.id }),
    });
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    markAsRead(id);
  };

  const handleClearAll = async () => {
    if (!user) return;
    await fetch(`/api/notifications?userId=${user.id}`, { method: 'DELETE' });
    setNotifications([]);
  };

  const handleClick = (notif: AppNotification) => {
    if (!notif.read) handleMarkRead(notif.id);
    if (notif.type === 'NEW_APPLICANT') navigate('company-applicants');
    else if (notif.type === 'APPLICATION_UPDATE') navigate('seeker-applications');
    else if (notif.type === 'JOB_NEW') navigate('jobs');
    else if (notif.type === 'MESSAGE') navigate('messages');
  };

  return (
    <div className="page-transition max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(user?.role === 'ADMIN' ? 'admin-dashboard' : user?.role === 'COMPANY' ? 'company-dashboard' : 'seeker-dashboard')}>
            <X className="w-4 h-4 ml-1" /> العودة
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            الإشعارات
            {unreadCount > 0 && (
              <Badge className="bg-emerald-500 text-white">{unreadCount} جديد</Badge>
            )}
          </h1>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="w-4 h-4 ml-1" /> تحديد الكل كمقروء
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-red-500 hover:text-red-600">
              <Trash2 className="w-4 h-4 ml-1" /> مسح الكل
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="max-h-[calc(100vh-200px)]">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-400 text-lg">لا توجد إشعارات</p>
              <p className="text-gray-300 text-sm mt-1">ستظهر هنا الإشعارات الجديدة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => {
              const Icon = typeIcons[notif.type] || Bell;
              return (
                <Card
                  key={notif.id}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${!notif.read ? 'border-r-4 border-r-emerald-500 bg-emerald-50/30' : ''}`}
                  onClick={() => handleClick(notif)}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[notif.type] || 'bg-gray-100 text-gray-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold text-sm ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notif.title}
                        </h3>
                        <span className="text-xs text-gray-400 shrink-0 mr-2">{timeAgo(notif.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}