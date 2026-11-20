import React, { useMemo, useState } from 'react';
import {
  Briefcase,
  Check,
  CheckCircle2,
  FilePlus2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import type { SafeUser } from '../api.ts';
import {
  BHUTAN_DZONGKHAGS,
  JOB_CATEGORIES,
  JOB_TYPES,
  type Application,
  type ApplicationStatus,
  type Job,
  type JobCategory,
  type JobType,
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
} from './UI.tsx';

type ProviderSection =
  | 'dashboard'
  | 'post-job'
  | 'manage-jobs'
  | 'applications'
  | 'profile'
  | 'help';

interface ProviderPortalProps {
  user: SafeUser;
  jobs: Job[];
  applications: Application[];
  notifications: NotificationItem[];
  messages: Message[];
  onLogout: () => void;
  onCreateJob: (payload: Partial<Job>) => Promise<Job>;
  onUpdateJob: (jobId: string, payload: Partial<Job>) => Promise<void>;
  onDeleteJob: (jobId: string) => Promise<void>;
  onUpdateApplicationStatus: (appId: string, status: ApplicationStatus) => Promise<void>;
  onSendMessage: (payload: {
    toUserId: string;
    toName: string;
    jobId?: string;
    jobTitle?: string;
    subject: string;
    body: string;
  }) => Promise<void>;
  onUpdateProfile: (updates: Partial<User> & { newPassword?: string }) => Promise<void>;
  onMarkNotificationRead: (notifId: string) => Promise<void>;
  onSubmitSupport: (payload: {
    name: string;
    email: string;
    topic: string;
    message: string;
  }) => Promise<void>;
  onNotifyToast: (msg: string, type?: 'success' | 'error') => void;
}

export function ProviderPortal({
  user,
  jobs,
  applications,
  notifications,
  messages,
  onLogout,
  onCreateJob,
  onUpdateJob,
  onDeleteJob,
  onUpdateApplicationStatus,
  onSendMessage,
  onUpdateProfile,
  onMarkNotificationRead,
  onSubmitSupport,
  onNotifyToast,
}: ProviderPortalProps) {
  const [section, setSection] = useState<ProviderSection>('dashboard');
  const [dashboardTab, setDashboardTab] = useState('Overview');
  const [postJobTab, setPostJobTab] = useState('Create Job Post');
  const [manageTab, setManageTab] = useState('My Job Posts');
  const [appsTab, setAppsTab] = useState('View Applicants');
  const [profileTab, setProfileTab] = useState('Provider Profile');
  const [helpTab, setHelpTab] = useState('Help Center');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // 4-step Post Job Wizard state
  const [draftTitle, setDraftTitle] = useState('');
  const [draftCategory, setDraftCategory] = useState<JobCategory>('Design');
  const [draftType, setDraftType] = useState<JobType>('Full-time');
  const [draftLocation, setDraftLocation] = useState('Thimphu');
  const [draftSalary, setDraftSalary] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftRequirements, setDraftRequirements] = useState('');
  const [draftApplyBy, setDraftApplyBy] = useState('2026-12-20');
  const [postingJob, setPostingJob] = useState(false);
  const [postedJobSuccess, setPostedJobSuccess] = useState<Job | null>(null);

  // Manage Jobs state
  const myJobs = useMemo(
    () => jobs.filter((j) => j.providerId === user.id),
    [jobs, user.id],
  );
  const myJobIds = useMemo(() => new Set(myJobs.map((j) => j.id)), [myJobs]);
  const myApplications = useMemo(
    () => applications.filter((a) => myJobIds.has(a.jobId)),
    [applications, myJobIds],
  );

  const [editingJobId, setEditingJobId] = useState<string>(myJobs[0]?.id || '');
  const activeEditJob = useMemo(
    () => myJobs.find((j) => j.id === editingJobId) || myJobs[0] || null,
    [myJobs, editingJobId],
  );

  const [editJobTitle, setEditJobTitle] = useState(activeEditJob?.title || '');
  const [editJobCategory, setEditJobCategory] = useState<JobCategory>(
    activeEditJob?.category || 'Design',
  );
  const [editJobType, setEditJobType] = useState<JobType>(activeEditJob?.type || 'Full-time');
  const [editJobLocation, setEditJobLocation] = useState(activeEditJob?.location || 'Thimphu');
  const [editJobSalary, setEditJobSalary] = useState(activeEditJob?.salary || '');
  const [editJobDesc, setEditJobDesc] = useState(activeEditJob?.description || '');
  const [editJobApplyBy, setEditJobApplyBy] = useState(activeEditJob?.applyBy || '2026-12-20');

  // Applications & Contact state
  const [filterJobId, setFilterJobId] = useState<string>('All');
  const [selectedAppId, setSelectedAppId] = useState<string>(myApplications[0]?.id || '');
  const [resumeModalApp, setResumeModalApp] = useState<Application | null>(null);
  const [reportJob, setReportJob] = useState<Job | null>(null);

  const selectedApplicant = useMemo(
    () => myApplications.find((a) => a.id === selectedAppId) || myApplications[0] || null,
    [myApplications, selectedAppId],
  );

  const [msgRecipientId, setMsgRecipientId] = useState<string>(
    myApplications[0]?.seekerId || '',
  );
  const [msgSubject, setMsgSubject] = useState('Interview invitation');
  const [msgBody, setMsgBody] = useState('');

  // Provider Profile edit state
  const [orgName, setOrgName] = useState(user.name);
  const [orgIndustry, setOrgIndustry] = useState(user.industry || 'Technology');
  const [orgLocation, setOrgLocation] = useState(user.location || 'Thimphu');
  const [orgTeamSize, setOrgTeamSize] = useState(user.teamSize || '24 employees');
  const [orgAbout, setOrgAbout] = useState(user.about);

  // Provider Account settings
  const [settingsEmail, setSettingsEmail] = useState(user.email);
  const [settingsPassword, setSettingsPassword] = useState('');

  // Help & Support state
  const [expandedHelp, setExpandedHelp] = useState<string | null>(null);
  const [supportTopic, setSupportTopic] = useState('Billing');
  const [supportMessage, setSupportMessage] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeJobsCount = myJobs.filter((j) => j.status === 'Live').length;
  const shortlistedCount = myApplications.filter(
    (a) => a.status === 'Shortlisted' || a.status === 'Interview',
  ).length;
  const hiresMadeCount = myApplications.filter((a) => a.status === 'Accepted').length;

  const loadJobIntoEditor = (job: Job) => {
    setEditingJobId(job.id);
    setEditJobTitle(job.title);
    setEditJobCategory(job.category);
    setEditJobType(job.type);
    setEditJobLocation(job.location);
    setEditJobSalary(job.salary);
    setEditJobDesc(job.description);
    setEditJobApplyBy(job.applyBy);
    setSection('manage-jobs');
    setManageTab('Edit Job Post');
  };

  const handlePublishJob = async () => {
    if (!draftTitle.trim()) {
      onNotifyToast('Please enter a job title in Step 1.', 'error');
      setPostJobTab('Create Job Post');
      return;
    }
    setPostingJob(true);
    try {
      const created = await onCreateJob({
        providerId: user.id,
        company: user.name,
        title: draftTitle.trim(),
        category: draftCategory,
        type: draftType,
        location: draftLocation,
        salary: draftSalary.trim() ? `Nu ${draftSalary.replace(/^Nu\s*/i, '')}` : 'Nu 30–45k',
        description:
          draftDescription.trim() ||
          `Join ${user.name} in ${draftLocation}. Clear weekly deliverables and supportive team culture.`,
        requirements: draftRequirements
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        applyBy: draftApplyBy || '2026-12-20',
      });
      setPostedJobSuccess(created);
      setDraftTitle('');
      setDraftSalary('');
      setDraftDescription('');
      setDraftRequirements('');
    } finally {
      setPostingJob(false);
    }
  };

  const openContactForApp = (app: Application) => {
    setMsgRecipientId(app.seekerId);
    const job = myJobs.find((j) => j.id === app.jobId);
    setMsgSubject(`Regarding ${job?.title || 'your application'}`);
    setMsgBody(
      `Hi ${app.seekerName.split(' ')[0]}, we'd love to chat about the ${
        job?.title || 'role'
      } at ${user.name}...`,
    );
    setSection('applications');
    setAppsTab('Contact Freelancer');
  };

  const navItems: { id: ProviderSection; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'post-job', label: 'Post a Job', icon: <FilePlus2 className="h-4 w-4" /> },
    { id: 'manage-jobs', label: 'Manage Jobs', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'applications', label: 'Applications', icon: <Users className="h-4 w-4" /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon className="h-4 w-4" /> },
    { id: 'help', label: 'Help & Support', icon: <HelpCircle className="h-4 w-4" /> },
  ];

  const postStepMap: Record<string, number> = {
    'Create Job Post': 1,
    'Job Details Form': 2,
    'Preview Job': 3,
    'Post Job': 4,
  };
  const currentPostStep = postStepMap[postJobTab] || 1;

  const visibleApplications = useMemo(() => {
    if (filterJobId === 'All') return myApplications;
    return myApplications.filter((a) => a.jobId === filterJobId);
  }, [myApplications, filterJobId]);

  const renderApplicantRow = (app: Application) => {
    const job = myJobs.find((j) => j.id === app.jobId);
    return (
      <div
        key={app.id}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-xl border border-[#1E293B] bg-[#121C31] px-4 py-3.5"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <AvatarSquare label={app.seekerName} />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-sm font-semibold text-white">{app.seekerName}</h3>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {job?.title || 'Role'} · {app.seekerLocation} · {app.seekerExperience}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedAppId(app.id);
              setAppsTab('Applicant Profile');
            }}
            className="rounded-lg border border-[#283652] bg-[#162138] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
          >
            View profile
          </button>
          <button
            type="button"
            onClick={() => onUpdateApplicationStatus(app.id, 'Shortlisted')}
            className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
          >
            Shortlist
          </button>
          <button
            type="button"
            onClick={() => onUpdateApplicationStatus(app.id, 'Accepted')}
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onUpdateApplicationStatus(app.id, 'Rejected')}
            className="rounded-lg border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/25 cursor-pointer"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => openContactForApp(app)}
            className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
          >
            Contact
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#0B111E] text-slate-100">
      {mobileNavOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 flex flex-col justify-between border-r border-[#1E293B] bg-[#0E1628] px-3 py-4 transition-transform md:static md:translate-x-0 ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="px-2 pb-5">
            <DrukLinkLogo
              badge="Job provider"
              onClick={() => {
                setSection('dashboard');
                setDashboardTab('Overview');
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
                    setPostedJobSuccess(null);
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
            <span className="text-xs font-medium text-slate-300">{user.name}</span>
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
                setProfileTab('Provider Profile');
              }}
              className="h-8 w-8 rounded-full bg-[#1C2C4E] border border-[#2C4270] text-xs font-semibold text-blue-200 flex items-center justify-center hover:bg-[#233761] cursor-pointer"
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-8 max-w-5xl w-full">
          {/* SECTION: DASHBOARD */}
          {section === 'dashboard' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{dashboardTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {dashboardTab === 'Overview'
                    ? 'A snapshot of your hiring this week.'
                    : dashboardTab === 'Job Performance'
                    ? 'See which posts attract the right people.'
                    : 'New applicants and deadlines.'}
                </p>
              </div>

              <SubTabBar
                tabs={['Overview', 'Job Performance', 'Notifications']}
                active={dashboardTab}
                onSelect={setDashboardTab}
              />

              {dashboardTab === 'Overview' ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4">
                      <p className="text-xs text-slate-400">Active jobs</p>
                      <p className="mt-2 text-2xl font-bold text-white">{activeJobsCount}</p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        {myJobs.length} total posted
                      </span>
                    </div>
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4">
                      <p className="text-xs text-slate-400">Total applicants</p>
                      <p className="mt-2 text-2xl font-bold text-white">{myApplications.length}</p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        Live pipeline
                      </span>
                    </div>
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4">
                      <p className="text-xs text-slate-400">Shortlisted</p>
                      <p className="mt-2 text-2xl font-bold text-white">{shortlistedCount}</p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        Ready to interview
                      </span>
                    </div>
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4">
                      <p className="text-xs text-slate-400">Hires made</p>
                      <p className="mt-2 text-2xl font-bold text-white">{hiresMadeCount}</p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
                        This month
                      </span>
                    </div>
                  </div>

                  <BarChart7Days
                    title="Applicants, last 7 days"
                    values={[4, 7, 5, 10, 6, 12, 9]}
                  />
                </div>
              ) : null}

              {dashboardTab === 'Job Performance' ? (
                <div className="space-y-5">
                  <BarChart7Days
                    title="Views vs. applications"
                    values={[18, 29, 22, 36, 25, 42, 31]}
                  />

                  <div className="rounded-xl border border-[#1E293B] bg-[#121C31] overflow-hidden">
                    <div className="grid grid-cols-12 gap-3 border-b border-[#1E293B] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <div className="col-span-5">Job</div>
                      <div className="col-span-3">Status</div>
                      <div className="col-span-2">Applicants</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>
                    {myJobs.map((job) => {
                      const count = myApplications.filter((a) => a.jobId === job.id).length;
                      return (
                        <div
                          key={job.id}
                          className="grid grid-cols-12 gap-3 items-center border-b border-[#1E293B]/60 last:border-b-0 px-5 py-3.5 text-xs"
                        >
                          <div className="col-span-5 font-medium text-white">{job.title}</div>
                          <div className="col-span-3">
                            <StatusBadge status={job.status} />
                          </div>
                          <div className="col-span-2 text-slate-300">{count}</div>
                          <div className="col-span-2 text-right">
                            <button
                              type="button"
                              onClick={() => setReportJob(job)}
                              className="rounded-lg border border-[#283652] bg-[#162138] px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                            >
                              View report
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {dashboardTab === 'Notifications' ? (
                <div className="space-y-2.5">
                  {notifications.length === 0 ? (
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-8 text-center text-xs text-slate-400">
                      No new notifications.
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
                            if (notif.targetSection === 'applications') {
                              setSection('applications');
                              setAppsTab(notif.targetTab || 'View Applicants');
                            } else if (notif.targetSection === 'manage-jobs') {
                              setSection('manage-jobs');
                              setManageTab('My Job Posts');
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && notif.targetSection === 'applications') {
                              setSection('applications');
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <p className="text-xs sm:text-sm font-medium text-white">{notif.title}</p>
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
              ) : null}
            </div>
          ) : null}

          {/* SECTION: POST A JOB (4-Step Wizard) */}
          {section === 'post-job' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{postJobTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {postJobTab === 'Create Job Post'
                    ? 'Start with the basics. You can edit later.'
                    : postJobTab === 'Job Details Form'
                    ? 'Add the details seekers care about most.'
                    : postJobTab === 'Preview Job'
                    ? 'This is how your post will appear to seekers.'
                    : 'One last check before going live.'}
                </p>
              </div>

              <SubTabBar
                tabs={['Create Job Post', 'Job Details Form', 'Preview Job', 'Post Job']}
                active={postJobTab}
                onSelect={(tab) => {
                  setPostedJobSuccess(null);
                  setPostJobTab(tab);
                }}
              />

              {/* 4-Step Indicator Bar */}
              <div className="grid grid-cols-4 gap-2 max-w-lg mb-5">
                {[
                  { step: 1, label: '1. Create', tab: 'Create Job Post' },
                  { step: 2, label: '2. Details', tab: 'Job Details Form' },
                  { step: 3, label: '3. Preview', tab: 'Preview Job' },
                  { step: 4, label: '4. Post', tab: 'Post Job' },
                ].map((item) => {
                  const active = currentPostStep === item.step;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => {
                        setPostedJobSuccess(null);
                        setPostJobTab(item.tab);
                      }}
                      className={`rounded-lg py-2 text-xs font-medium text-center border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'bg-[#121C31] text-slate-400 border-[#1E293B] hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {postedJobSuccess ? (
                <div className="max-w-lg rounded-xl border border-emerald-500/30 bg-[#121C31] p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Your job is posted!</h2>
                      <p className="text-xs text-slate-400">
                        &quot;{postedJobSuccess.title}&quot; in {postedJobSuccess.location} is now
                        live for job seekers across Bhutan.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setPostedJobSuccess(null);
                        setSection('manage-jobs');
                        setManageTab('My Job Posts');
                      }}
                      className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      View in Manage Jobs
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPostedJobSuccess(null);
                        setPostJobTab('Create Job Post');
                      }}
                      className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                    >
                      Post another job
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {postJobTab === 'Create Job Post' ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setPostJobTab('Job Details Form');
                      }}
                      className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Job title
                        </label>
                        <input
                          type="text"
                          required
                          value={draftTitle}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          placeholder="e.g. Senior UI Designer"
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Job category
                        </label>
                        <select
                          value={draftCategory}
                          onChange={(e) => setDraftCategory(e.target.value as JobCategory)}
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          {JOB_CATEGORIES.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Job type
                        </label>
                        <select
                          value={draftType}
                          onChange={(e) => setDraftType(e.target.value as JobType)}
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          {JOB_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2.5 pt-1">
                        <button
                          type="submit"
                          className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                        >
                          Continue to details
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSection('dashboard');
                            setDashboardTab('Overview');
                          }}
                          className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {postJobTab === 'Job Details Form' ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setPostJobTab('Preview Job');
                      }}
                      className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Location
                        </label>
                        <select
                          value={draftLocation}
                          onChange={(e) => setDraftLocation(e.target.value)}
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
                          Monthly salary (Nu)
                        </label>
                        <input
                          type="text"
                          value={draftSalary}
                          onChange={(e) => setDraftSalary(e.target.value)}
                          placeholder="e.g. 45,000 – 60,000"
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Description
                        </label>
                        <textarea
                          rows={4}
                          value={draftDescription}
                          onChange={(e) => setDraftDescription(e.target.value)}
                          placeholder="Describe the role, duties and requirements..."
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Requirements (one per line, optional)
                        </label>
                        <textarea
                          rows={2}
                          value={draftRequirements}
                          onChange={(e) => setDraftRequirements(e.target.value)}
                          placeholder="e.g. Figma proficiency&#10;Available in Thimphu or Remote"
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Apply by
                        </label>
                        <input
                          type="date"
                          value={draftApplyBy}
                          onChange={(e) => setDraftApplyBy(e.target.value)}
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setPostJobTab('Create Job Post')}
                          className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                        >
                          Preview my job
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {postJobTab === 'Preview Job' ? (
                    <div className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4">
                      <div className="flex items-center gap-3.5">
                        <AvatarSquare label={draftTitle || 'UI Designer'} size="lg" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-white">
                              {draftTitle || 'UI Designer'}
                            </h2>
                            <StatusBadge status="Open" />
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {draftLocation} ·{' '}
                            {draftSalary.trim()
                              ? `Nu ${draftSalary.replace(/^Nu\s*/i, '')}`
                              : 'Nu 45–60k'}{' '}
                            · {draftType} · Apply by {draftApplyBy}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {draftDescription.trim() ||
                          'Design clean, accessible interfaces for apps used across Bhutan.'}
                      </p>
                      <div className="flex items-center gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setPostJobTab('Job Details Form')}
                          className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostJobTab('Post Job')}
                          className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                        >
                          Looks good, continue
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {postJobTab === 'Post Job' ? (
                    <div className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4">
                      <h2 className="text-sm font-bold text-white">Ready to go live?</h2>
                      <p className="text-xs text-slate-400">
                        Seekers will see your job right away. You can edit or close it any time.
                      </p>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setPostJobTab('Preview Job')}
                          className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={postingJob}
                          onClick={handlePublishJob}
                          className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-60 cursor-pointer"
                        >
                          {postingJob ? 'Posting...' : 'Post job'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          {/* SECTION: MANAGE JOBS */}
          {section === 'manage-jobs' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{manageTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {manageTab === 'My Job Posts'
                    ? "Everything you've posted, in one place."
                    : manageTab === 'Edit Job Post'
                    ? 'Update role details, salary, or deadline.'
                    : manageTab === 'Close / Delete Job'
                    ? 'Pause applications or remove an expired post.'
                    : 'Applicant progress across all your roles.'}
                </p>
              </div>

              <SubTabBar
                tabs={[
                  'My Job Posts',
                  'Edit Job Post',
                  'Close / Delete Job',
                  'Applicants Summary',
                ]}
                active={manageTab}
                onSelect={setManageTab}
              />

              {manageTab === 'My Job Posts' ? (
                <div className="rounded-xl border border-[#1E293B] bg-[#121C31] overflow-hidden">
                  <div className="grid grid-cols-12 gap-3 border-b border-[#1E293B] px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <div className="col-span-5">Job</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-2">Applicants</div>
                    <div className="col-span-2 text-right">Action</div>
                  </div>
                  {myJobs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No jobs posted yet. Go to Post a Job to publish your first role!
                    </div>
                  ) : (
                    myJobs.map((job) => {
                      const count = myApplications.filter((a) => a.jobId === job.id).length;
                      return (
                        <div
                          key={job.id}
                          className="grid grid-cols-12 gap-3 items-center border-b border-[#1E293B]/60 last:border-b-0 px-5 py-3.5 text-xs"
                        >
                          <div className="col-span-5">
                            <p className="font-medium text-white">{job.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {job.location} · {job.type}
                            </p>
                          </div>
                          <div className="col-span-3">
                            <StatusBadge status={job.status} />
                          </div>
                          <div className="col-span-2 text-slate-300">{count}</div>
                          <div className="col-span-2 text-right">
                            <button
                              type="button"
                              onClick={() => loadJobIntoEditor(job)}
                              className="rounded-lg border border-[#283652] bg-[#162138] px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                            >
                              Edit job
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : null}

              {manageTab === 'Edit Job Post' ? (
                myJobs.length === 0 ? (
                  <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-8 text-center text-xs text-slate-400">
                    No job posts to edit yet.
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!activeEditJob) return;
                      await onUpdateJob(activeEditJob.id, {
                        title: editJobTitle,
                        category: editJobCategory,
                        type: editJobType,
                        location: editJobLocation,
                        salary: editJobSalary,
                        description: editJobDesc,
                        applyBy: editJobApplyBy,
                      });
                      setManageTab('My Job Posts');
                    }}
                    className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Select job to edit
                      </label>
                      <select
                        value={activeEditJob?.id || ''}
                        onChange={(e) => {
                          const found = myJobs.find((j) => j.id === e.target.value);
                          if (found) loadJobIntoEditor(found);
                        }}
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        {myJobs.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.title} ({j.status})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Job title
                      </label>
                      <input
                        type="text"
                        required
                        value={editJobTitle}
                        onChange={(e) => setEditJobTitle(e.target.value)}
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Category
                        </label>
                        <select
                          value={editJobCategory}
                          onChange={(e) => setEditJobCategory(e.target.value as JobCategory)}
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          {JOB_CATEGORIES.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Type
                        </label>
                        <select
                          value={editJobType}
                          onChange={(e) => setEditJobType(e.target.value as JobType)}
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                        >
                          {JOB_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1.5">
                          Location
                        </label>
                        <select
                          value={editJobLocation}
                          onChange={(e) => setEditJobLocation(e.target.value)}
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
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
                          Salary
                        </label>
                        <input
                          type="text"
                          value={editJobSalary}
                          onChange={(e) => setEditJobSalary(e.target.value)}
                          className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={editJobDesc}
                        onChange={(e) => setEditJobDesc(e.target.value)}
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Apply by
                      </label>
                      <input
                        type="date"
                        value={editJobApplyBy}
                        onChange={(e) => setEditJobApplyBy(e.target.value)}
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="submit"
                        className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                      >
                        Save changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setManageTab('My Job Posts')}
                        className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )
              ) : null}

              {manageTab === 'Close / Delete Job' ? (
                <div className="space-y-2.5 max-w-3xl">
                  {myJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#1E293B] bg-[#121C31] px-4 py-3.5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white">{job.title}</h3>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {job.location} · {job.type} · Apply by {job.applyBy}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateJob(job.id, {
                              status: job.status === 'Live' ? 'Closed' : 'Live',
                            })
                          }
                          className="rounded-lg border border-[#283652] bg-[#162138] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                        >
                          {job.status === 'Live' ? 'Close job' : 'Reopen job'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteJob(job.id)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {manageTab === 'Applicants Summary' ? (
                <div className="space-y-3 max-w-3xl">
                  {myJobs.map((job) => {
                    const jobApps = myApplications.filter((a) => a.jobId === job.id);
                    const shortlisted = jobApps.filter(
                      (a) => a.status === 'Shortlisted' || a.status === 'Interview',
                    ).length;
                    const accepted = jobApps.filter((a) => a.status === 'Accepted').length;
                    const pending = jobApps.filter(
                      (a) => a.status === 'New' || a.status === 'Under review',
                    ).length;
                    return (
                      <div
                        key={job.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#1E293B] bg-[#121C31] px-4 py-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">{job.title}</h3>
                            <StatusBadge status={job.status} />
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Total: {jobApps.length} · Pending: {pending} · Shortlisted: {shortlisted}{' '}
                            · Accepted: {accepted}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFilterJobId(job.id);
                            setSection('applications');
                            setAppsTab('View Applicants');
                          }}
                          className="shrink-0 rounded-lg bg-[#2563EB] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                        >
                          Review applicants
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* SECTION: APPLICATIONS */}
          {section === 'applications' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{appsTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {appsTab === 'View Applicants'
                    ? 'Review candidates who applied to your roles.'
                    : appsTab === 'Applicant Profile'
                    ? 'Details from their DrukLink profile.'
                    : appsTab === 'Shortlist Applicants'
                    ? 'Your top picks, ready for interviews.'
                    : appsTab === 'Accept / Reject Application'
                    ? 'Give applicants a clear status update.'
                    : 'Messages are sent in the workspace and by email.'}
                </p>
              </div>

              <SubTabBar
                tabs={[
                  'View Applicants',
                  'Applicant Profile',
                  'Shortlist Applicants',
                  'Accept / Reject Application',
                  'Contact Freelancer',
                ]}
                active={appsTab}
                onSelect={setAppsTab}
              />

              {appsTab === 'View Applicants' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFilterJobId('All')}
                      className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${
                        filterJobId === 'All'
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#121C31] text-slate-300 border border-[#1E293B]'
                      }`}
                    >
                      All jobs ({myApplications.length})
                    </button>
                    {myJobs.map((job) => {
                      const c = myApplications.filter((a) => a.jobId === job.id).length;
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => setFilterJobId(job.id)}
                          className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${
                            filterJobId === job.id
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-[#121C31] text-slate-300 border border-[#1E293B]'
                          }`}
                        >
                          {job.title} ({c})
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-2.5">
                    {visibleApplications.length === 0 ? (
                      <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-8 text-center text-xs text-slate-400">
                        No applicants for this filter yet.
                      </div>
                    ) : (
                      visibleApplications.map((app) => renderApplicantRow(app))
                    )}
                  </div>
                </div>
              ) : null}

              {appsTab === 'Applicant Profile' ? (
                selectedApplicant ? (
                  <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <AvatarSquare label={selectedApplicant.seekerName} size="lg" />
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-base font-bold text-white">
                              {selectedApplicant.seekerName}
                            </h2>
                            <StatusBadge status={selectedApplicant.status} />
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Applied for{' '}
                            {myJobs.find((j) => j.id === selectedApplicant.jobId)?.title || 'Role'} ·{' '}
                            {selectedApplicant.seekerLocation} ·{' '}
                            {selectedApplicant.seekerExperience}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {selectedApplicant.seekerSkills.map((sk) => (
                              <span
                                key={sk}
                                className="rounded-full bg-[#192641] px-2.5 py-0.5 text-[11px] text-blue-200 border border-[#26385C]"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setResumeModalApp(selectedApplicant)}
                        className="shrink-0 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                      >
                        View resume
                      </button>
                    </div>

                    <div className="rounded-xl border border-[#1E293B] bg-[#0B111E] p-4 space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Cover Note
                      </p>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {selectedApplicant.coverNote}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateApplicationStatus(selectedApplicant.id, 'Shortlisted')
                        }
                        className="rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                      >
                        Shortlist
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateApplicationStatus(selectedApplicant.id, 'Accepted')}
                        className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateApplicationStatus(selectedApplicant.id, 'Rejected')}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/15 px-3.5 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => openContactForApp(selectedApplicant)}
                        className="rounded-lg border border-[#283652] bg-[#162138] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-8 text-center text-xs text-slate-400">
                    No applicant selected yet.
                  </div>
                )
              ) : null}

              {appsTab === 'Shortlist Applicants' ? (
                <div className="space-y-2.5">
                  {myApplications.filter(
                    (a) => a.status === 'Shortlisted' || a.status === 'Interview',
                  ).length === 0 ? (
                    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-8 text-center text-xs text-slate-400">
                      No shortlisted candidates yet. Click Shortlist on any applicant to add them
                      here.
                    </div>
                  ) : (
                    myApplications
                      .filter((a) => a.status === 'Shortlisted' || a.status === 'Interview')
                      .map((app) => renderApplicantRow(app))
                  )}
                </div>
              ) : null}

              {appsTab === 'Accept / Reject Application' ? (
                <div className="space-y-2.5">
                  {myApplications.map((app) => renderApplicantRow(app))}
                </div>
              ) : null}

              {appsTab === 'Contact Freelancer' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const targetApp =
                        myApplications.find((a) => a.seekerId === msgRecipientId) ||
                        myApplications[0];
                      if (!targetApp) {
                        onNotifyToast('No applicant available to message yet.', 'error');
                        return;
                      }
                      const job = myJobs.find((j) => j.id === targetApp.jobId);
                      await onSendMessage({
                        toUserId: targetApp.seekerId,
                        toName: targetApp.seekerName,
                        jobId: job?.id,
                        jobTitle: job?.title,
                        subject: msgSubject,
                        body: msgBody,
                      });
                      setMsgBody('');
                    }}
                    className="rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">To</label>
                      <select
                        value={msgRecipientId}
                        onChange={(e) => setMsgRecipientId(e.target.value)}
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        {Array.from(
                          new Map(myApplications.map((a) => [a.seekerId, a])).values(),
                        ).map((a) => (
                          <option key={a.seekerId} value={a.seekerId}>
                            {a.seekerName} ({a.seekerEmail})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        required
                        value={msgSubject}
                        onChange={(e) => setMsgSubject(e.target.value)}
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Message
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={msgBody}
                        onChange={(e) => setMsgBody(e.target.value)}
                        placeholder="Hi Karma, we'd love to chat about the role..."
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
                        onClick={() => setMsgBody('')}
                        className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Sent Messages
                    </h3>
                    {messages.length === 0 ? (
                      <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-6 text-xs text-slate-400">
                        No messages sent yet.
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className="rounded-xl border border-[#1E293B] bg-[#121C31] p-4 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-white">
                              To: {msg.toName} — {msg.subject}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {msg.createdAt.slice(0, 10)}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-300">{msg.body}</p>
                        </div>
                      ))
                    )}
                  </div>
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
                  {profileTab === 'Provider Profile'
                    ? 'How seekers see your team.'
                    : profileTab === 'Edit Organisation Details'
                    ? 'Update your public company profile.'
                    : 'Manage sign-in and billing contact.'}
                </p>
              </div>

              <SubTabBar
                tabs={['Provider Profile', 'Edit Organisation Details', 'Account Settings']}
                active={profileTab}
                onSelect={setProfileTab}
              />

              {profileTab === 'Provider Profile' ? (
                <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <AvatarSquare label={user.name} size="lg" />
                      <div>
                        <h2 className="text-base font-bold text-white">{user.name}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {user.headline ||
                            `${user.industry || 'Technology'} · ${user.location} · ${
                              user.teamSize || '24 employees'
                            }`}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {user.skills.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[#192641] px-2.5 py-0.5 text-[11px] text-blue-200 border border-[#26385C]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSection('manage-jobs');
                        setManageTab('My Job Posts');
                      }}
                      className="shrink-0 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      View jobs
                    </button>
                  </div>
                  {user.about ? (
                    <p className="text-xs leading-relaxed text-slate-300 border-t border-[#1E293B] pt-3">
                      {user.about}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {profileTab === 'Edit Organisation Details' ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await onUpdateProfile({
                      name: orgName,
                      industry: orgIndustry,
                      location: orgLocation,
                      teamSize: orgTeamSize,
                      about: orgAbout,
                    });
                    onNotifyToast('Organisation details updated!');
                    setProfileTab('Provider Profile');
                  }}
                  className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Organisation name
                    </label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Industry
                    </label>
                    <select
                      value={orgIndustry}
                      onChange={(e) => setOrgIndustry(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      {[
                        'Technology',
                        'Engineering',
                        'Tourism',
                        'Finance',
                        'Agriculture',
                        'Education',
                        'Health',
                        'Media',
                      ].map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Location
                      </label>
                      <select
                        value={orgLocation}
                        onChange={(e) => setOrgLocation(e.target.value)}
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
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
                        Team size
                      </label>
                      <input
                        type="text"
                        value={orgTeamSize}
                        onChange={(e) => setOrgTeamSize(e.target.value)}
                        className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">About</label>
                    <textarea
                      rows={3}
                      value={orgAbout}
                      onChange={(e) => setOrgAbout(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      Save organisation
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileTab('Provider Profile')}
                      className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              {profileTab === 'Account Settings' ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await onUpdateProfile({
                      email: settingsEmail,
                      newPassword: settingsPassword || undefined,
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
                  <div className="flex items-center gap-2.5">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      Update settings
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileTab('Provider Profile')}
                      className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}

          {/* SECTION: HELP & SUPPORT */}
          {section === 'help' ? (
            <div>
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{helpTab}</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {helpTab === 'Help Center'
                    ? 'Guides for employers.'
                    : helpTab === 'FAQs'
                    ? 'Frequently asked questions.'
                    : 'Reach our team; we reply within one working day.'}
                </p>
              </div>
              <SubTabBar
                tabs={['Help Center', 'FAQs', 'Contact Support']}
                active={helpTab}
                onSelect={setHelpTab}
              />

              {helpTab === 'Help Center' ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                  {[
                    {
                      title: 'Posting your first job',
                      sub: 'Step-by-step guide',
                      detail:
                        'Use the 4-step wizard under Post a Job to include clear tasks, salary in Ngultrum, and an application deadline.',
                    },
                    {
                      title: 'Reviewing applicants',
                      sub: 'Shortlist faster',
                      detail:
                        'Open Applications to view candidate CVs, shortlist top fits, and send interview invitations directly.',
                    },
                    {
                      title: 'Billing',
                      sub: 'Free plan limits',
                      detail:
                        'Every Bhutanese employer receives 2 free job posts per month with unlimited applicant management.',
                    },
                  ].map((card) => (
                    <button
                      key={card.title}
                      type="button"
                      onClick={() =>
                        setExpandedHelp(expandedHelp === card.title ? null : card.title)
                      }
                      className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5 text-left hover:border-blue-500/40 transition-colors cursor-pointer"
                    >
                      <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                      <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
                      {expandedHelp === card.title ? (
                        <p className="mt-3 pt-3 border-t border-[#1E293B] text-xs leading-relaxed text-slate-300">
                          {card.detail}
                        </p>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}

              {helpTab === 'FAQs' ? (
                <div className="space-y-3 max-w-2xl">
                  {[
                    {
                      q: 'How do I post a job?',
                      a: 'Go to Post a Job and follow the four steps.',
                    },
                    {
                      q: 'How many posts are free?',
                      a: 'Every employer gets 2 free posts a month.',
                    },
                    {
                      q: 'How do I close a job?',
                      a: 'Open Manage Jobs, then choose Close job.',
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
              ) : null}

              {helpTab === 'Contact Support' ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await onSubmitSupport({
                      name: user.name,
                      email: user.email,
                      topic: supportTopic,
                      message: supportMessage,
                    });
                    setSupportMessage('');
                  }}
                  className="max-w-lg rounded-xl border border-[#1E293B] bg-[#121C31] p-6 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Topic</label>
                    <select
                      value={supportTopic}
                      onChange={(e) => setSupportTopic(e.target.value)}
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Billing">Billing</option>
                      <option value="Job posting">Job posting</option>
                      <option value="Candidate verification">Candidate verification</option>
                      <option value="Technical support">Technical support</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="How can we help?"
                      className="w-full rounded-lg border border-[#1E293B] bg-[#0B111E] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                    >
                      Send to support
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupportMessage('')}
                      className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1E2D4A] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}
        </main>
      </div>

      {/* Job Performance Report Modal */}
      {reportJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#1E293B] bg-[#111A2E] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">{reportJob.title} — Report</h3>
                <p className="text-xs text-slate-400">
                  {reportJob.location} · {reportJob.type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportJob(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-[#1E293B] bg-[#0B111E] p-3">
                <p className="text-[11px] text-slate-400">Views</p>
                <p className="mt-1 text-lg font-bold text-white">{reportJob.views}</p>
              </div>
              <div className="rounded-xl border border-[#1E293B] bg-[#0B111E] p-3">
                <p className="text-[11px] text-slate-400">Applicants</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {myApplications.filter((a) => a.jobId === reportJob.id).length}
                </p>
              </div>
              <div className="rounded-xl border border-[#1E293B] bg-[#0B111E] p-3">
                <p className="text-[11px] text-slate-400">Shortlisted</p>
                <p className="mt-1 text-lg font-bold text-emerald-400">
                  {
                    myApplications.filter(
                      (a) =>
                        a.jobId === reportJob.id &&
                        (a.status === 'Shortlisted' || a.status === 'Interview'),
                    ).length
                  }
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterJobId(reportJob.id);
                  setReportJob(null);
                  setSection('applications');
                  setAppsTab('View Applicants');
                }}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
              >
                View applicants
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Applicant Resume Preview Modal */}
      <ResumeModal
        isOpen={Boolean(resumeModalApp)}
        onClose={() => setResumeModalApp(null)}
        ownerName={resumeModalApp?.seekerName || ''}
        resumeName={resumeModalApp?.resumeName}
        resumeDataUrl={resumeModalApp?.resumeDataUrl}
        headline={resumeModalApp?.seekerExperience}
        location={resumeModalApp?.seekerLocation}
        skills={resumeModalApp?.seekerSkills}
        about={resumeModalApp?.coverNote}
      />
    </div>
  );
}
