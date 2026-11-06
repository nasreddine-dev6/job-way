'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import Header from '@/components/jobway/Header';
import Footer from '@/components/jobway/Footer';
import LandingPage from '@/components/jobway/LandingPage';
import AuthForms from '@/components/jobway/AuthForms';
import JobListings from '@/components/jobway/JobListings';
import JobDetail from '@/components/jobway/JobDetail';
import SeekerDashboard from '@/components/jobway/SeekerDashboard';
import ResumeWizard from '@/components/jobway/ResumeWizard';
import CompanyDashboard from '@/components/jobway/CompanyDashboard';
import ProfilePage from '@/components/jobway/ProfilePage';
import AdminDashboard from '@/components/jobway/AdminDashboard';
import MessagesPage from '@/components/jobway/Messages';
import NotificationsPanel from '@/components/jobway/NotificationsPanel';

export default function JobWayApp() {
  const { currentView, user, setUser, navigate } = useAppStore();

  // Check for stored session on mount
  useEffect(() => {
    const stored = localStorage.getItem('jobway_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch { /* ignore */ }
    }

    // Seed admin account
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed-admin' }),
    });
  }, [setUser]);

  // Persist user to localStorage on change
  useEffect(() => {
    if (user) {
      localStorage.setItem('jobway_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('jobway_user');
    }
  }, [user]);

  // Load notifications for logged-in users
  useEffect(() => {
    if (!user) return;
    const loadNotifs = () => {
      fetch(`/api/notifications?userId=${user.id}`)
        .then(r => r.json())
        .then(data => useAppStore.getState().setNotifications(data.notifications || []))
        .catch(() => {});
    };
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Auth guard for protected views
  const isProtected = !['landing', 'login', 'register', 'jobs', 'job-detail'].includes(currentView);
  useEffect(() => {
    if (isProtected && !user) {
      navigate('login');
    }
  }, [isProtected, user, navigate]);

  // Redirect already-logged-in users away from auth pages to their dashboard
  useEffect(() => {
    if (user && (currentView === 'login' || currentView === 'register')) {
      const dashboards: Record<string, string> = {
        ADMIN: 'admin-dashboard',
        SEEKER: 'seeker-dashboard',
        COMPANY: 'company-dashboard',
      };
      navigate((dashboards[user.role] || 'landing') as never);
    }
  }, [user, currentView, navigate]);

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <LandingPage />;
      case 'login':
      case 'register': return <AuthForms />;
      case 'jobs': return <JobListings />;
      case 'job-detail': return <JobDetail />;
      case 'seeker-dashboard':
      case 'seeker-applications': return <SeekerDashboard />;
      case 'seeker-resume': return <ResumeWizard />;
      case 'company-dashboard':
      case 'company-manage-jobs':
      case 'company-post-job':
      case 'company-applicants': return <CompanyDashboard />;
      case 'admin-dashboard':
      case 'admin-users':
      case 'admin-jobs':
      case 'admin-applications': return <AdminDashboard />;
      case 'messages': return <MessagesPage />;
      case 'notifications': return <NotificationsPanel />;
      case 'profile': return <ProfilePage />;
      default: return <LandingPage />;
    }
  };

  const showHeader = !['login', 'register'].includes(currentView);
  const showFooter = !['login', 'register', 'seeker-resume', 'messages'].includes(currentView);

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">
        {renderView()}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}