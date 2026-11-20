import React, { useCallback, useEffect, useState } from 'react';
import { api, type SafeUser } from './api.ts';
import { AuthView } from './components/AuthView.tsx';
import { HomeView } from './components/HomeView.tsx';
import { ProviderPortal } from './components/ProviderPortal.tsx';
import { SeekerPortal } from './components/SeekerPortal.tsx';
import { ToastBanner } from './components/UI.tsx';
import type {
  Application,
  ApplicationStatus,
  Job,
  Message,
  NotificationItem,
  User,
  UserRole,
} from './types.ts';

const SESSION_KEY = 'druklink_user_id';

export default function App() {
  const [view, setView] = useState<'home' | 'auth' | 'portal'>('home');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authRole, setAuthRole] = useState<UserRole>('seeker');

  const [user, setUser] = useState<SafeUser | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  const syncState = useCallback(async (explicitUserId?: string) => {
    try {
      const uid = explicitUserId ?? sessionStorage.getItem(SESSION_KEY) ?? '';
      const data = await api.getState(uid || undefined);
      setJobs(data.jobs);
      setApplications(data.applications);
      setNotifications(data.notifications);
      setMessages(data.messages);
      if (data.user) {
        setUser(data.user);
        setView('portal');
      } else if (!uid) {
        setUser(null);
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncState();
  }, [syncState]);

  // Keep Seeker & Provider views synchronized in real time across tabs
  useEffect(() => {
    const interval = setInterval(() => {
      const uid = sessionStorage.getItem(SESSION_KEY) || undefined;
      syncState(uid);
    }, 5000);
    return () => clearInterval(interval);
  }, [syncState]);

  const handleLogin = async (email: string, password: string, role: UserRole) => {
    const res = await api.login({ email, password, role });
    sessionStorage.setItem(SESSION_KEY, res.user.id);
    setUser(res.user);
    await syncState(res.user.id);
    setView('portal');
    showToast(`Welcome back, ${res.user.name}!`);
  };

  const handleSignup = async (name: string, email: string, password: string, role: UserRole) => {
    const res = await api.signup({ name, email, password, role });
    sessionStorage.setItem(SESSION_KEY, res.user.id);
    setUser(res.user);
    await syncState(res.user.id);
    setView('portal');
    showToast(`Account created! Welcome to DrukLink, ${res.user.name}.`);
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    try {
      const email = role === 'provider' ? 'hr@thimphutech.bt' : 'tenzin@email.bt';
      await handleLogin(email, 'password123', role);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Demo login failed.', 'error');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    setNotifications([]);
    setMessages([]);
    setView('home');
    showToast('Logged out.');
  };

  const handleToggleSaveJob = async (jobId: string) => {
    if (!user) return;
    try {
      const res = await api.toggleSavedJob(user.id, jobId);
      setUser((prev) => (prev ? { ...prev, savedJobIds: res.savedJobIds } : prev));
      const saved = res.savedJobIds.includes(jobId);
      showToast(saved ? 'Job saved to bookmarks.' : 'Removed from saved jobs.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update saved job.', 'error');
    }
  };

  const handleApplyJob = async (payload: {
    jobId: string;
    seekerName: string;
    seekerEmail: string;
    resumeName: string;
    resumeDataUrl?: string;
    coverNote: string;
  }) => {
    if (!user) return;
    try {
      await api.applyForJob({
        ...payload,
        seekerId: user.id,
      });
      await syncState(user.id);
      showToast('Application submitted! Employer has been notified.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not submit application.';
      showToast(message, 'error');
      throw err;
    }
  };

  const handleUpdateProfile = async (updates: Partial<User> & { newPassword?: string }) => {
    if (!user) return;
    try {
      const res = await api.updateUser(user.id, updates);
      setUser(res.user);
      await syncState(user.id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update profile.', 'error');
    }
  };

  const handleCreateJob = async (payload: Partial<Job>): Promise<Job> => {
    try {
      const res = await api.createJob(payload);
      await syncState(user?.id);
      showToast(`"${res.job.title}" is now live!`);
      return res.job;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not publish job.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleUpdateJob = async (jobId: string, payload: Partial<Job>) => {
    try {
      await api.updateJob(jobId, payload);
      await syncState(user?.id);
      showToast('Job post updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update job.', 'error');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await api.deleteJob(jobId);
      await syncState(user?.id);
      showToast('Job post deleted.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete job.', 'error');
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, status: ApplicationStatus) => {
    try {
      await api.updateApplicationStatus(appId, status);
      await syncState(user?.id);
      showToast(`Applicant marked as ${status}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update status.', 'error');
    }
  };

  const handleSendMessage = async (payload: {
    toUserId: string;
    toName: string;
    jobId?: string;
    jobTitle?: string;
    subject: string;
    body: string;
  }) => {
    if (!user) return;
    try {
      await api.sendMessage({
        ...payload,
        fromUserId: user.id,
        fromName: user.name,
      });
      await syncState(user.id);
      showToast(`Message sent to ${payload.toName}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send message.', 'error');
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    if (!user) return;
    try {
      await api.markNotificationRead(notifId, user.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId || notifId === 'all' ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitSupport = async (payload: {
    name: string;
    email: string;
    topic: string;
    message: string;
  }) => {
    try {
      await api.submitSupport({ ...payload, userId: user?.id });
      showToast('Message sent! Our Thimphu support team will reply within 1 working day.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send support request.', 'error');
    }
  };

  const handleTrackJobView = (jobId: string) => {
    api.trackJobView(jobId).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B111E] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#3B82F6] text-xs font-bold text-white animate-pulse">
            D
          </span>
          <span>Loading DrukLink...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {view === 'home' || (!user && view === 'portal') ? (
        <HomeView
          jobs={jobs}
          onNavigateAuth={(mode, role) => {
            setAuthMode(mode);
            setAuthRole(role);
            setView('auth');
          }}
          onQuickDemoLogin={handleQuickDemoLogin}
        />
      ) : null}

      {view === 'auth' && !user ? (
        <AuthView
          mode={authMode}
          role={authRole}
          onChangeMode={setAuthMode}
          onChangeRole={setAuthRole}
          onBackHome={() => setView('home')}
          onLogin={handleLogin}
          onSignup={handleSignup}
          onQuickDemoLogin={handleQuickDemoLogin}
        />
      ) : null}

      {view === 'portal' && user ? (
        user.role === 'seeker' ? (
          <SeekerPortal
            user={user}
            jobs={jobs}
            applications={applications}
            notifications={notifications}
            messages={messages}
            onLogout={handleLogout}
            onToggleSaveJob={handleToggleSaveJob}
            onApplyJob={handleApplyJob}
            onUpdateProfile={handleUpdateProfile}
            onMarkNotificationRead={handleMarkNotificationRead}
            onSubmitSupport={handleSubmitSupport}
            onTrackJobView={handleTrackJobView}
            onNotifyToast={showToast}
          />
        ) : (
          <ProviderPortal
            user={user}
            jobs={jobs}
            applications={applications}
            notifications={notifications}
            messages={messages}
            onLogout={handleLogout}
            onCreateJob={handleCreateJob}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onSendMessage={handleSendMessage}
            onUpdateProfile={handleUpdateProfile}
            onMarkNotificationRead={handleMarkNotificationRead}
            onSubmitSupport={handleSubmitSupport}
            onNotifyToast={showToast}
          />
        )
      ) : null}

      <ToastBanner toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
