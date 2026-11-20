import React, { useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  Calendar,
  Check,
  HelpCircle,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Search,
  Upload,
  User as UserIcon,
  X,
} from 'lucide-react';
import type { SafeUser } from '../api.ts';
import {
  BHUTAN_DZONGKHAGS,
  JOB_CATEGORIES,
  JOB_TYPES,
  type Application,
  type Job,
  type JobCategory,
  type Message,
  type NotificationItem,
  type User,
} from '../types.ts';
import {
  AvatarSquare,
  BarChart7Days,
  DrukLinkLogo,
  ResumeModal,
  StatusBadge,
  SubTabBar,
  TypeBadge,
} from './UI.tsx';

type SeekerSection = 'jobs' | 'dashboard' | 'profile' | 'about' | 'contact' | 'help';

interface SeekerPortalProps {
  user: SafeUser;
  jobs: Job[];
  applications: Application[];
  notifications: NotificationItem[];
  messages: Message[];
  onLogout: () => void;
  onToggleSaveJob: (jobId: string) => Promise<void>;
  onApplyJob: (payload: {
    jobId: string;
    seekerName: string;
    seekerEmail: string;
    resumeName: string;
    resumeDataUrl?: string;
    coverNote: string;
  }) => Promise<void>;
  onUpdateProfile: (updates: Partial<User> & { newPassword?: string }) => Promise<void>;
  onMarkNotificationRead: (notifId: string) => Promise<void>;
  onSubmitSupport: (payload: {
    name: string;
    email: string;
    topic: string;
    message: string;
  }) => Promise<void>;
  onTrackJobView: (jobId: string) => void;
  onNotifyToast: (msg: string, type?: 'success' | 'error') => void;
}

export function SeekerPortal({
  user,
  jobs,
  applications,
  notifications,
  messages,
  onLogout,
  onToggleSaveJob,
  onApplyJob,
  onUpdateProfile,
  onMarkNotificationRead,
  onSubmitSupport,
  onTrackJobView,
  onNotifyToast,
}: SeekerPortalProps) {
  const [section, setSection] = useState<SeekerSection>('jobs');
  const [jobsTab, setJobsTab] = useState('Search Jobs');
  const [dashboardTab, setDashboardTab] = useState('Overview');
  const [profileTab, setProfileTab] = useState('My Profile');
  const [aboutTab, setAboutTab] = useState('About Us');
  const [contactTab, setContactTab] = useState('Contact Form');
  const [helpTab, setHelpTab] = useState('Help Center');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Search & filter state
  const [searchInput, setSearchInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<JobCategory | null>(null);

  // Selected job & application state
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [applyCoverNote, setApplyCoverNote] = useState('');
  const [applyName, setApplyName] = useState(user.name);
  const [applyEmail, setApplyEmail] = useState(user.email);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [detailModalApp, setDetailModalApp] = useState<Application | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [expandedHelpCard, setExpandedHelpCard] = useState<string | null>(null);

  // Profile edit form state
  const [editName, setEditName] = useState(user.name);
  const [editHeadline, setEditHeadline] = useState(user.headline);
  const [editLocation, setEditLocation] = useState(user.location);
  const [editSkills, setEditSkills] = useState(user.skills.join(', '));
  const [editAbout, setEditAbout] = useState(user.about);

  // Account settings state
  const [settingsEmail, setSettingsEmail] = useState(user.email);
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsAlerts, setSettingsAlerts] = useState<NonNullable<User['jobAlerts']>>(
    user.jobAlerts || 'Daily',
  );

  // Contact form state
  const [contactName, setContactName] = useState(user.name);
  const [contactEmail, setContactEmail] = useState(user.email);
  const [contactTopic, setContactTopic] = useState('General question');
  const [contactMessage, setContactMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const firstName = user.name.trim().split(' ')[0] || user.name;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const myApplications = useMemo(
    () => applications.filter((a) => a.seekerId === user.id),
    [applications, user.id],
  );

  const appliedJobIds = useMemo(
    () => new Set(myApplications.map((a) => a.jobId)),
    [myApplications],
  );

  const savedJobsList = useMemo(
    () => jobs.filter((j) => user.savedJobIds.includes(j.id)),
    [jobs, user.savedJobIds],
  );

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || jobs[0] || null,
    [jobs, selectedJobId],
  );

  const filteredJobs = useMemo(() => {
    const q = (appliedQuery || searchInput).trim().toLowerCase();
    return jobs.filter((job) => {
      if (job.status === 'Closed') return false;
      const matchesType = typeFilter === 'All' || job.type === typeFilter;
      const matchesCat = !categoryFilter || job.category === categoryFilter;
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.category.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q);
      return matchesType && matchesCat && matchesQuery;
    });
  }, [jobs, appliedQuery, searchInput, typeFilter, categoryFilter]);

  const liveOpportunities = useMemo(() => jobs.filter((j) => j.status === 'Live'), [jobs]);

  const recommendedJobs = useMemo(() => {
    const skillTerms = user.skills.map((s) => s.toLowerCase());
    const scored = liveOpportunities.map((job) => {
      let score = 0;
      if (job.location.toLowerCase() === user.location.toLowerCase()) score += 2;
      if (job.location === 'Remote') score += 1;
      const text = `${job.title} ${job.description} ${job.category}`.toLowerCase();
      skillTerms.forEach((sk) => {
        if (sk && text.includes(sk)) score += 2;
      });
      if (job.title.toLowerCase().includes('designer')) score += 2;
      return { job, score };
    });
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.job);
  }, [liveOpportunities, user.location, user.skills]);

  const profileStrength = useMemo(() => {
    let score = 45;
    if (user.headline.trim()) score += 15;
    if (user.about.trim().length > 20) score += 15;
    if (user.skills.length >= 3) score += 10;
    if (user.resumeName) score += 15;
    return Math.min(100, score);
  }, [user]);

  const interviewsCount = myApplications.filter(
    (a) => a.status === 'Interview' || a.status === 'Shortlisted' || a.status === 'Accepted',
  ).length;

  const openJobDetails = (job: Job) => {
    setSelectedJobId(job.id);
    setSection('jobs');
    setJobsTab('Job Details');
    onTrackJobView(job.id);
  };

  const openApplyForJob = (job: Job) => {
    setSelectedJobId(job.id);
    setApplyName(user.name);
    setApplyEmail(user.email);
    setApplyCoverNote('');
    setSection('jobs');
    setJobsTab('Apply for Job');
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setApplySubmitting(true);
    try {
      await onApplyJob({
        jobId: selectedJob.id,
        seekerName: applyName,
        seekerEmail: applyEmail,
        resumeName: user.resumeName || 'Tenzin_CV.pdf',
        resumeDataUrl: user.resumeDataUrl,
        coverNote: applyCoverNote,
      });
      setApplyCoverNote('');
      setSection('dashboard');
      setDashboardTab('My Applications');
    } catch {
      // toast handled by parent
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleResumeUpload = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onNotifyToast('Please select a file smaller than 5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
      await onUpdateProfile({ resumeName: file.name, resumeDataUrl: dataUrl });
      onNotifyToast(`Resume "${file.name}" uploaded!`);
    };
    reader.readAsDataURL(file);
  };

  const navItems: { id: SeekerSection; label: string; icon: React.ReactNode }[] = [
    { id: 'jobs', label: 'Jobs', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon className="h-4 w-4" /> },
    { id: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
    { id: 'contact', label: 'Contact', icon: <Mail className="h-4 w-4" /> },
    { id: 'help', label: 'Help', icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const renderJobRow = (job: Job, mode: 'default' | 'saved' = 'default') => {
    const isSaved = user.savedJobIds.includes(job.id);
    const hasApplied = appliedJobIds.has(job.id);

    return (
      <div
        key={job.id}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#1E293B] bg-[#121C31] px-4 py-3.5 hover:border-blue-500/35 transition-colors"
      >
        <div
          onClick={() => openJobDetails(job)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') openJobDetails(job);
          }}
          className="flex items-center gap-3.5 cursor-pointer text-left min-w-0"
        >
          <AvatarSquare label={job.title} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white hover:text-blue-300 transition-colors truncate">
                {job.title}
              </h3>
              <span className="text-[11px] text-slate-500">· Apply by {job.applyBy}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {job.company} · {job.location} · {job.salary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <TypeBadge type={job.type} />
          <button
            type="button"
            onClick={() => onToggleSaveJob(job.id)}
            className="rounded-lg border border-[#283652] bg-[#162138] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] transition-colors cursor-pointer"
          >
            {mode === 'saved' ? 'Remove' : isSaved ? 'Saved' : 'Save job'}
          </button>
          <button
            type="button"
            disabled={hasApplied}
            onClick={() => openApplyForJob(job)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              hasApplied
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-default'
                : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
            }`}
          >
            {hasApplied ? 'Applied' : 'Apply now'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#0B111E] text-slate-100">
      {/* Mobile Sidebar Overlay */}
      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 flex flex-col justify-between border-r border-[#1E293B] bg-[#0E1628] px-3 py-4 transition-transform md:static md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="px-2 pb-5">
            <DrukLinkLogo
              badge="Job seeker"
              onClick={() => {
                setSection('jobs');
                setJobsTab('Search Jobs');
              }}
            />
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-300 hover:bg-[#152038] hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-[#152038] hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Log out</span>
        </button>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-[#1E293B] bg-[#0B111E] px-5 sm:px-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden rounded-lg p-1.5 text-slate-300 hover:bg-[#152038]"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium text-slate-300">
              Welcome back, {firstName}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSection('dashboard');
                setDashboardTab('Notifications');
              }}
              className="relative rounded-lg border border-[#1E293B] bg-[#121C31] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 transition-colors cursor-pointer"
            >
              Notifications
              {unreadCount > 0 ? (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563EB] px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => {
                setSection('profile');
                setProfileTab('My Profile');
              }}
              className="h-8 w-8 rounded-full bg-[#1C2C4E] border border-[#2C4270] text-xs font-semibold text-blue-200 flex items-center justify-center hover:bg-[#233761] cursor-pointer"
              title={user.name}
            >
              {firstName.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-5 sm:p-8 max-w-5xl w-full">
          {/* SECTION: JOBS */}
          {section === 'jobs' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{jobsTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {jobsTab === 'Search Jobs'
                    ? 'Search by role, skill or district.'
                    : jobsTab === 'Job Opportunities'
                    ? 'Fresh roles from Bhutanese employers, newest first.'
                    : jobsTab === 'Job Categories'
                    ? 'Pick a field to see matching roles.'
                    : jobsTab === 'Saved Jobs'
                    ? 'Roles you bookmarked. Apply before they close.'
                    : jobsTab === 'Job Details'
                    ? 'Everything you need to decide before applying.'
                    : 'Your profile and resume are attached automatically.'}
                </p>
              </div>

              <SubTabBar
                tabs={[
                  'Search Jobs',
                  'Job Opportunities',
                  'Job Categories',
                  'Saved Jobs',
                  'Job Details',
                  'Apply for Job',
                ]}
                active={jobsTab}
                onSelect={setJobsTab}
              />

              {jobsTab === 'Search Jobs' ? (
                <div className="space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setAppliedQuery(searchInput);
                    }}
                    className="flex items-center rounded-xl border border-[#1E293B] bg-[#121C31] p-1.5"
                  >
                    <Search className="ml-3 h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        setAppliedQuery(e.target.value);
                      }}
                      placeholder="Job title, skill or company"
                      className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      Search jobs
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center gap-2">
                    {['All', 'Full-time', 'Part-time', 'Remote', 'Freelance', 'Contract'].map(
                      (t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTypeFilter(t)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                            typeFilter === t
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-[#121C31] text-slate-300 border border-[#1E293B] hover:text-white'
                          }`}
                        >
                          {t}
                        </button>
                      ),
                    )}
                    {categoryFilter ? (
                      <button
                        type="button"
                        onClick={() => setCategoryFilter(null)}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs text-blue-200 cursor-pointer"
                      >
                        Category: {categoryFilter}
                        <X className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>

                  <div className="space-y-2.5">
                    {filteredJobs.length === 0 ? (
                      <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-8 text-center text-xs text-slate-400">
                        No open jobs match that filter right now. Try selecting &quot;All&quot;.
                      </div>
                    ) : (
                      filteredJobs.map((job) => renderJobRow(job))
                    )}
                  </div>
                </div>
              ) : null}

              {jobsTab === 'Job Opportunities' ? (
                <div className="space-y-2.5">
                  {liveOpportunities.map((job) => renderJobRow(job))}
                </div>
              ) : null}

              {jobsTab === 'Job Categories' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {JOB_CATEGORIES.map((cat) => {
                    const liveCount = liveOpportunities.filter((j) => j.category === cat.name).length;
                    const displayCount = cat.baseCount + liveCount;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          setCategoryFilter(cat.name);
                          setTypeFilter('All');
                          setJobsTab('Search Jobs');
                        }}
                        className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5 text-left hover:border-blue-500/40 hover:bg-[#15213A] transition-all cursor-pointer"
                      >
                        <AvatarSquare label={cat.letter} size="sm" />
                        <h3 className="mt-4 text-sm font-semibold text-white">{cat.name}</h3>
                        <p className="mt-1 text-xs text-slate-400">{displayCount} open roles</p>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {jobsTab === 'Saved Jobs' ? (
                <div className="space-y-2.5">
                  {savedJobsList.length === 0 ? (
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-8 text-center text-xs text-slate-400">
                      You haven&apos;t saved any jobs yet. Click &quot;Save job&quot; on any role to
                      bookmark it here.
                    </div>
                  ) : (
                    savedJobsList.map((job) => renderJobRow(job, 'saved'))
                  )}
                </div>
              ) : null}

              {jobsTab === 'Job Details' && selectedJob ? (
                <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <AvatarSquare label={selectedJob.title} size="lg" />
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-lg font-bold text-white">{selectedJob.title}</h2>
                          <StatusBadge status={selectedJob.status === 'Live' ? 'Open' : 'Closed'} />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {selectedJob.company} · {selectedJob.location} · {selectedJob.salary} ·{' '}
                          {selectedJob.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B111E] px-3 py-1.5 border border-[#1E293B]">
                        <MapPin className="h-3.5 w-3.5 text-blue-400" />
                        {selectedJob.location}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B111E] px-3 py-1.5 border border-[#1E293B]">
                        <Calendar className="h-3.5 w-3.5 text-blue-400" />
                        Deadline: {selectedJob.applyBy}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                    {selectedJob.description}
                  </p>

                  {selectedJob.requirements.length > 0 ? (
                    <div className="rounded-xl border border-[#1E293B] bg-[#0B111E]/70 p-4">
                      <h3 className="text-xs font-semibold text-white mb-2">Requirements</h3>
                      <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                        {selectedJob.requirements.map((req, idx) => (
                          <li key={idx}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={
                        appliedJobIds.has(selectedJob.id) || selectedJob.status === 'Closed'
                      }
                      onClick={() => openApplyForJob(selectedJob)}
                      className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        appliedJobIds.has(selectedJob.id)
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-default'
                          : selectedJob.status === 'Closed'
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                      }`}
                    >
                      {appliedJobIds.has(selectedJob.id)
                        ? 'Already applied'
                        : selectedJob.status === 'Closed'
                        ? 'Role closed'
                        : 'Apply for this job'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSaveJob(selectedJob.id)}
                      className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                    >
                      {user.savedJobIds.includes(selectedJob.id) ? 'Saved' : 'Save job'}
                    </button>
                  </div>
                </div>
              ) : null}

              {jobsTab === 'Apply for Job' && selectedJob ? (
                <form
                  onSubmit={handleApplySubmit}
                  className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4"
                >
                  <div className="rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">{selectedJob.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {selectedJob.company} · {selectedJob.location} · {selectedJob.salary}
                      </p>
                    </div>
                    <TypeBadge type={selectedJob.type} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      value={applyName}
                      onChange={(e) => setApplyName(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={applyEmail}
                      onChange={(e) => setApplyEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Resume</label>
                    <div className="flex items-center justify-between rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-slate-200">
                      <span>{user.resumeName || 'Tenzin_CV.pdf'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSection('profile');
                          setProfileTab('Resume');
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Cover note
                    </label>
                    <textarea
                      rows={4}
                      value={applyCoverNote}
                      onChange={(e) => setApplyCoverNote(e.target.value)}
                      placeholder="Tell the employer why you're a great fit..."
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="submit"
                      disabled={applySubmitting || appliedJobIds.has(selectedJob.id)}
                      className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer"
                    >
                      {appliedJobIds.has(selectedJob.id)
                        ? 'Already submitted'
                        : applySubmitting
                        ? 'Submitting...'
                        : 'Submit application'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setJobsTab('Job Details')}
                      className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {/* SECTION: DASHBOARD */}
          {section === 'dashboard' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{dashboardTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {dashboardTab === 'Overview'
                    ? "Here's what's happening with your job search."
                    : dashboardTab === 'My Applications'
                    ? 'Track every application in one place.'
                    : dashboardTab === 'Saved Jobs'
                    ? 'Roles you bookmarked. Apply before they close.'
                    : dashboardTab === 'Recommended Jobs'
                    ? 'Picked for you based on your skills and location.'
                    : 'Stay on top of replies and new matches.'}
                </p>
              </div>

              <SubTabBar
                tabs={[
                  'Overview',
                  'My Applications',
                  'Saved Jobs',
                  'Recommended Jobs',
                  'Notifications',
                ]}
                active={dashboardTab}
                onSelect={setDashboardTab}
              />

              {dashboardTab === 'Overview' ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4">
                      <p className="text-xs text-slate-400">Applications</p>
                      <p className="mt-2 text-2xl font-bold text-white">{myApplications.length}</p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        +{Math.max(1, myApplications.length)} this week
                      </span>
                    </div>
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4">
                      <p className="text-xs text-slate-400">Interviews &amp; Shortlists</p>
                      <p className="mt-2 text-2xl font-bold text-white">{interviewsCount}</p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        {interviewsCount > 0 ? `${interviewsCount} active` : 'Keep applying'}
                      </span>
                    </div>
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4">
                      <p className="text-xs text-slate-400">Saved jobs</p>
                      <p className="mt-2 text-2xl font-bold text-white">{savedJobsList.length}</p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        Ready to apply
                      </span>
                    </div>
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4">
                      <p className="text-xs text-slate-400">Profile strength</p>
                      <p className="mt-2 text-2xl font-bold text-white">{profileStrength}%</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSection('profile');
                          setProfileTab('Edit Profile');
                        }}
                        className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/25 cursor-pointer"
                      >
                        {profileStrength === 100 ? 'Complete' : 'Update profile'}
                      </button>
                    </div>
                  </div>

                  <BarChart7Days
                    title="Activity, last 7 days"
                    values={[2, 4, 3, 6, 4, 7, 5]}
                  />
                </div>
              ) : null}

              {dashboardTab === 'My Applications' ? (
                <div className="rounded-xl border border-[#1E293B] bg-[#121C31] overflow-hidden">
                  <div className="grid grid-cols-12 gap-3 border-b border-[#1E293B] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <div className="col-span-4">Role</div>
                    <div className="col-span-3">Company</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-2 text-right">Action</div>
                  </div>
                  {myApplications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No applications yet. Browse open roles under Jobs to apply in one tap!
                    </div>
                  ) : (
                    myApplications.map((app) => {
                      const job = jobs.find((j) => j.id === app.jobId);
                      return (
                        <div
                          key={app.id}
                          className="grid grid-cols-12 gap-3 items-center border-b border-[#1E293B]/60 last:border-b-0 px-5 py-3.5 text-xs"
                        >
                          <div className="col-span-4 font-medium text-white">
                            {job?.title || 'Role'}
                          </div>
                          <div className="col-span-3 text-slate-300">
                            {job?.company || 'Bhutan Employer'}
                          </div>
                          <div className="col-span-3">
                            <StatusBadge status={app.status} />
                          </div>
                          <div className="col-span-2 text-right">
                            <button
                              type="button"
                              onClick={() => setDetailModalApp(app)}
                              className="rounded-lg border border-[#283652] bg-[#162138] px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                            >
                              View details
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : null}

              {dashboardTab === 'Saved Jobs' ? (
                <div className="space-y-2.5">
                  {savedJobsList.length === 0 ? (
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-8 text-center text-xs text-slate-400">
                      No saved jobs yet.
                    </div>
                  ) : (
                    savedJobsList.map((job) => renderJobRow(job, 'saved'))
                  )}
                </div>
              ) : null}

              {dashboardTab === 'Recommended Jobs' ? (
                <div className="space-y-2.5">
                  {recommendedJobs.map((job) => renderJobRow(job))}
                </div>
              ) : null}

              {dashboardTab === 'Notifications' ? (
                <div className="space-y-4">
                  <div className="space-y-2.5">
                    {notifications.length === 0 ? (
                      <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-8 text-center text-xs text-slate-400">
                        You&apos;re all caught up!
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 ${
                            notif.read
                              ? 'border-[#1E293B] bg-[#10182B] opacity-75'
                              : 'border-blue-500/30 bg-[#121C31]'
                          }`}
                        >
                          <div
                            onClick={() => {
                              if (notif.targetSection === 'jobs' && notif.relatedId) {
                                const j = jobs.find((item) => item.id === notif.relatedId);
                                if (j) openJobDetails(j);
                              } else if (notif.targetTab) {
                                setDashboardTab(notif.targetTab);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && notif.targetTab) {
                                setDashboardTab(notif.targetTab);
                              }
                            }}
                            className="cursor-pointer"
                          >
                            <p className="text-xs sm:text-sm font-medium text-white">
                              {notif.title}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{notif.timeLabel}</p>
                          </div>
                          {!notif.read ? (
                            <button
                              type="button"
                              onClick={() => onMarkNotificationRead(notif.id)}
                              className="shrink-0 rounded-lg border border-[#283652] bg-[#162138] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                            >
                              Mark as read
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                              <Check className="h-3.5 w-3.5" /> Read
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {messages.length > 0 ? (
                    <div className="pt-2 space-y-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Messages from Employers
                      </h3>
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">
                              {msg.fromName} — {msg.subject}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {msg.createdAt.slice(0, 10)}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-300">{msg.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* SECTION: PROFILE */}
          {section === 'profile' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{profileTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {profileTab === 'My Profile'
                    ? 'This is how employers see you.'
                    : profileTab === 'Edit Profile'
                    ? 'Keep your details fresh to get noticed.'
                    : profileTab === 'Resume'
                    ? 'Upload a PDF or Word file up to 5 MB.'
                    : 'Manage sign-in and notification preferences.'}
                </p>
              </div>

              <SubTabBar
                tabs={['My Profile', 'Edit Profile', 'Resume', 'Account Settings']}
                active={profileTab}
                onSelect={setProfileTab}
              />

              {profileTab === 'My Profile' ? (
                <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <AvatarSquare label={user.name} size="lg" />
                      <div>
                        <h2 className="text-base font-bold text-white">{user.name}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {user.headline || `${user.location} · ${user.experience}`}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {user.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-[#192641] px-2.5 py-0.5 text-[11px] text-blue-200 border border-[#26385C]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowResumeModal(true)}
                      className="shrink-0 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      View resume
                    </button>
                  </div>
                  {user.about ? (
                    <p className="text-xs leading-relaxed text-slate-300 border-t border-[#1E293B] pt-3">
                      {user.about}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {profileTab === 'Edit Profile' ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await onUpdateProfile({
                      name: editName,
                      headline: editHeadline,
                      location: editLocation,
                      skills: editSkills
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                      about: editAbout,
                    });
                    onNotifyToast('Profile updated successfully!');
                    setProfileTab('My Profile');
                  }}
                  className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Headline
                    </label>
                    <input
                      type="text"
                      value={editHeadline}
                      onChange={(e) => setEditHeadline(e.target.value)}
                      placeholder="UI Designer · 3 yrs experience"
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Location
                    </label>
                    <select
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      {BHUTAN_DZONGKHAGS.map((dz) => (
                        <option key={dz} value={dz}>
                          {dz}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editSkills}
                      onChange={(e) => setEditSkills(e.target.value)}
                      placeholder="Figma, Research, Prototyping, Dzongkha"
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      About you
                    </label>
                    <textarea
                      rows={3}
                      value={editAbout}
                      onChange={(e) => setEditAbout(e.target.value)}
                      placeholder="Short intro..."
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      Save changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileTab('My Profile')}
                      className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              {profileTab === 'Resume' ? (
                <div className="max-w-lg space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleResumeUpload(e.dataTransfer.files?.[0]);
                    }}
                    className="rounded-xl border border-dashed border-[#2C3E61] bg-[#121C31] p-10 text-center"
                  >
                    <Upload className="mx-auto h-6 w-6 text-blue-400 mb-2" />
                    <p className="text-xs font-semibold text-white">Drop your resume here</p>
                    <p className="mt-1 text-[11px] text-slate-400">PDF or Word, up to 5 MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleResumeUpload(e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      Choose a file
                    </button>
                  </div>

                  {user.resumeName ? (
                    <div className="flex items-center justify-between rounded-xl border border-[#1E293B] bg-[#121C31] px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-white">{user.resumeName}</p>
                        <p className="text-[11px] text-slate-400">
                          Attached automatically when you apply
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowResumeModal(true)}
                        className="rounded-lg border border-[#283652] bg-[#162138] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                      >
                        Preview
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {profileTab === 'Account Settings' ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await onUpdateProfile({
                      email: settingsEmail,
                      newPassword: settingsPassword || undefined,
                      jobAlerts: settingsAlerts,
                    });
                    setSettingsPassword('');
                    onNotifyToast('Account settings updated.');
                  }}
                  className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={settingsEmail}
                      onChange={(e) => setSettingsEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      New password
                    </label>
                    <input
                      type="password"
                      minLength={8}
                      value={settingsPassword}
                      onChange={(e) => setSettingsPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Job alerts
                    </label>
                    <select
                      value={settingsAlerts}
                      onChange={(e) =>
                        setSettingsAlerts(e.target.value as NonNullable<User['jobAlerts']>)
                      }
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Instant">Instant</option>
                      <option value="Off">Off</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      Update settings
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileTab('My Profile')}
                      className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {/* SECTION: ABOUT */}
          {section === 'about' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{aboutTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {aboutTab === 'About Us'
                    ? "Bhutan's home for work."
                    : aboutTab === 'Our Mission'
                    ? 'Why we exist.'
                    : 'How we handle your data.'}
                </p>
              </div>
              <SubTabBar
                tabs={['About Us', 'Our Mission', 'Terms & Privacy']}
                active={aboutTab}
                onSelect={setAboutTab}
              />
              <div className="max-w-xl rounded-xl border border-[#1E293B] bg-[#121C31] p-5 text-xs leading-relaxed text-slate-300 space-y-2">
                {aboutTab === 'About Us' ? (
                  <>
                    <p>
                      DrukLink connects job seekers and employers across all twenty dzongkhags, from
                      Thimphu start-ups to Bumthang farms.
                    </p>
                    <p>We keep hiring simple, transparent and local.</p>
                  </>
                ) : aboutTab === 'Our Mission' ? (
                  <>
                    <p>
                      Every Bhutanese should find meaningful work close to home, and every business
                      should find the right people fast.
                    </p>
                    <p>We build tools that are fair, fast and free for seekers.</p>
                  </>
                ) : (
                  <>
                    <p>We only share your profile with employers you apply to.</p>
                    <p>You can export or delete your data at any time from Account Settings.</p>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {/* SECTION: CONTACT */}
          {section === 'contact' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{contactTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {contactTab === 'Contact Form'
                    ? 'We usually reply within one working day.'
                    : 'Choose the fastest way to reach us.'}
                </p>
              </div>
              <SubTabBar
                tabs={['Contact Form', 'Support']}
                active={contactTab}
                onSelect={setContactTab}
              />

              {contactTab === 'Contact Form' ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await onSubmitSupport({
                      name: contactName,
                      email: contactEmail,
                      topic: contactTopic,
                      message: contactMessage,
                    });
                    setContactMessage('');
                  }}
                  className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Your name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Topic</label>
                    <select
                      value={contactTopic}
                      onChange={(e) => setContactTopic(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="General question">General question</option>
                      <option value="Application help">Application help</option>
                      <option value="Account issue">Account issue</option>
                      <option value="Report a job post">Report a job post</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="How can we help?"
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      Send message
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactMessage('')}
                      className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                  <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5">
                    <h3 className="text-sm font-semibold text-white">Live chat</h3>
                    <p className="mt-1 text-xs text-slate-400">Mon–Fri, 9am–5pm BST</p>
                  </div>
                  <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5">
                    <h3 className="text-sm font-semibold text-white">Email us</h3>
                    <p className="mt-1 text-xs text-slate-400">support@druklink.bt</p>
                  </div>
                  <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5">
                    <h3 className="text-sm font-semibold text-white">Call us</h3>
                    <p className="mt-1 text-xs text-slate-400">+975 2 000 000</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* SECTION: HELP */}
          {section === 'help' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{helpTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {helpTab === 'Help Center'
                    ? 'Quick answers to common questions.'
                    : 'Frequently asked questions.'}
                </p>
              </div>
              <SubTabBar
                tabs={['Help Center', 'FAQs']}
                active={helpTab}
                onSelect={setHelpTab}
              />

              {helpTab === 'Help Center' ? (
                <div className="space-y-4 max-w-3xl">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        title: 'Getting started',
                        desc: 'Create your account',
                        detail:
                          'Complete your headline, dzongkhag, and top skills under Profile so Bhutanese employers can match you faster.',
                      },
                      {
                        title: 'Applying for jobs',
                        desc: 'Tips for stronger applications',
                        detail:
                          'Upload your PDF resume once and include a concise 2–3 sentence cover note explaining why your skills fit the task.',
                      },
                      {
                        title: 'Account & privacy',
                        desc: 'Manage your data',
                        detail:
                          'Your contact details and CV are only visible to employers whose jobs you explicitly apply to.',
                      },
                    ].map((card) => (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() =>
                          setExpandedHelpCard(
                            expandedHelpCard === card.title ? null : card.title,
                          )
                        }
                        className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5 text-left hover:border-blue-500/40 transition-colors cursor-pointer"
                      >
                        <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                        <p className="mt-1 text-xs text-slate-400">{card.desc}</p>
                        {expandedHelpCard === card.title ? (
                          <p className="mt-3 pt-3 border-t border-[#1E293B] text-xs leading-relaxed text-slate-300">
                            {card.detail}
                          </p>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-w-2xl">
                  {[
                    {
                      q: 'How do I reset my password?',
                      a: 'Go to Account Settings, choose New password, then tap Update settings.',
                    },
                    {
                      q: 'Is DrukLink free?',
                      a: 'Yes for job seekers. Employers get 2 free posts a month.',
                    },
                    {
                      q: 'How do I delete my account?',
                      a: "Contact support and we'll remove your data within 7 days.",
                    },
                  ].map((faq) => (
                    <div
                      key={faq.q}
                      className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4 space-y-1"
                    >
                      <h3 className="text-xs sm:text-sm font-semibold text-white">{faq.q}</h3>
                      <p className="text-xs text-slate-400">{faq.a}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>

      {/* Application Detail Modal */}
      {detailModalApp ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#1E293B] bg-[#111A2E] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {jobs.find((j) => j.id === detailModalApp.jobId)?.title || 'Application Details'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {jobs.find((j) => j.id === detailModalApp.jobId)?.company || 'Employer'}
                </p>
              </div>
              <StatusBadge status={detailModalApp.status} />
            </div>
            <div className="rounded-xl border border-[#1E293B] bg-[#0B111E] p-4 text-xs space-y-2">
              <p className="text-slate-400">
                Resume attached: <span className="text-white">{detailModalApp.resumeName}</span>
              </p>
              <p className="text-slate-400">Cover note:</p>
              <p className="text-slate-200 leading-relaxed">{detailModalApp.coverNote}</p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalApp(null)}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Resume Preview Modal */}
      <ResumeModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        ownerName={user.name}
        resumeName={user.resumeName}
        resumeDataUrl={user.resumeDataUrl}
        headline={user.headline}
        location={user.location}
        skills={user.skills}
        about={user.about}
      />
    </div>
  );
}
