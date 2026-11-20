import React, { useMemo, useState } from 'react';
import { Calendar, MapPin, Search, X } from 'lucide-react';
import { JOB_TYPES, type Job, type UserRole } from '../types.ts';
import { AvatarSquare, DrukLinkLogo, StatusBadge, TypeBadge } from './UI.tsx';

interface HomeViewProps {
  jobs: Job[];
  onNavigateAuth: (mode: 'login' | 'signup', role: UserRole) => void;
  onQuickDemoLogin: (role: UserRole) => void;
}

export function HomeView({ jobs, onNavigateAuth, onQuickDemoLogin }: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [showAllJobsModal, setShowAllJobsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [infoModal, setInfoModal] = useState<'about' | 'contact' | 'terms' | null>(null);

  const liveJobs = useMemo(() => jobs.filter((j) => j.status === 'Live'), [jobs]);

  const featuredJobs = useMemo(() => {
    const picked = liveJobs.filter((j) => j.featured);
    return (picked.length >= 3 ? picked : liveJobs).slice(0, 3);
  }, [liveJobs]);

  const filteredModalJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return liveJobs.filter((job) => {
      const matchesType = typeFilter === 'All' || job.type === typeFilter;
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.category.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [liveJobs, searchQuery, typeFilter]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAllJobsModal(true);
  };

  return (
    <div className="min-h-screen bg-[#0B111E] text-slate-100 flex flex-col">
      {/* Top Hero Header Band (Deep Navy matching Figma) */}
      <div className="bg-gradient-to-b from-[#132863] via-[#112355] to-[#0D1A40] border-b border-white/10">
        {/* Navbar */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <DrukLinkLogo />

          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
            <button
              type="button"
              onClick={() => setShowAllJobsModal(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Find jobs
            </button>
            <button
              type="button"
              onClick={() => onNavigateAuth('signup', 'provider')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              For employers
            </button>
            <button
              type="button"
              onClick={() => setInfoModal('about')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigateAuth('login', 'seeker')}
              className="rounded-lg border border-white/15 bg-[#0D1736]/80 px-3.5 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => onNavigateAuth('signup', 'seeker')}
              className="rounded-lg bg-[#2563EB] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#1D4ED8] transition-colors shadow-sm cursor-pointer"
            >
              Sign up free
            </button>
          </div>
        </header>

        {/* Hero Body */}
        <section className="mx-auto max-w-3xl px-6 pt-12 pb-16 text-center">
          <p className="text-[11px] font-medium tracking-wide text-blue-200/80 mb-3">
            Made for Bhutan
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-[1.12]">
            Find work you love. Hire people you trust.
          </h1>
          <p className="mt-4 text-sm sm:text-[15px] text-blue-100/75 max-w-xl mx-auto">
            Thousands of roles across all twenty dzongkhags, from first jobs to leadership.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 mx-auto flex max-w-xl items-center rounded-xl border border-white/10 bg-[#0B111E]/90 p-1.5 shadow-xl"
          >
            <Search className="ml-3 h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Job title, skill or company"
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] transition-colors cursor-pointer"
            >
              Search jobs
            </button>
          </form>

          {/* Dual role CTAs */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateAuth('signup', 'seeker')}
              className="rounded-lg border border-white/15 bg-[#0D1736]/75 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Join as a job seeker
            </button>
            <button
              type="button"
              onClick={() => onNavigateAuth('signup', 'provider')}
              className="rounded-lg border border-white/15 bg-[#0D1736]/75 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Hire with DrukLink
            </button>
          </div>
        </section>
      </div>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 space-y-12">
        {/* Featured jobs */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base sm:text-lg font-semibold text-white">Featured jobs</h2>
            <button
              type="button"
              onClick={() => setShowAllJobsModal(true)}
              className="rounded-lg border border-[#1E293B] bg-[#121C31] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors cursor-pointer"
            >
              Browse all jobs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSelectedJob(job);
                }}
                className="group rounded-xl border border-[#1E293B] bg-[#121C31] p-5 hover:border-blue-500/40 hover:bg-[#152038] transition-all cursor-pointer"
              >
                <AvatarSquare label={job.title} size="sm" />
                <h3 className="mt-4 text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {job.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {job.company} · {job.location}
                </p>
                <div className="mt-4 flex items-center gap-2.5">
                  <TypeBadge type={job.type} />
                  <span className="text-xs font-medium text-slate-300">{job.salary}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How DrukLink works */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-white mb-5">How DrukLink works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5">
              <h3 className="text-sm font-semibold text-white">1. Create your profile</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Share your skills or organisation details in minutes.
              </p>
            </div>
            <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5">
              <h3 className="text-sm font-semibold text-white">2. Apply or post</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Seekers apply in one tap. Employers publish in four steps.
              </p>
            </div>
            <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5">
              <h3 className="text-sm font-semibold text-white">3. Connect and hire</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Message, shortlist and decide, all in one place.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="rounded-2xl bg-[#2563EB] px-6 py-7 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg shadow-blue-950/30">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Ready to hire your next teammate?
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-blue-100/90">Post your first job free.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateAuth('signup', 'provider')}
            className="shrink-0 rounded-lg bg-[#0B111E] px-4 py-2.5 text-xs font-medium text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Post a job for free
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] bg-[#0B111E]">
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-3 px-6 py-5 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>© 2026 DrukLink · Thimphu, Bhutan</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onQuickDemoLogin('seeker')}
                className="text-blue-400/80 hover:text-blue-300 underline underline-offset-2 cursor-pointer"
              >
                Demo Seeker
              </button>
              <span className="text-slate-700">·</span>
              <button
                type="button"
                onClick={() => onQuickDemoLogin('provider')}
                className="text-blue-400/80 hover:text-blue-300 underline underline-offset-2 cursor-pointer"
              >
                Demo Provider
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setInfoModal('about')}
              className="hover:text-slate-300 cursor-pointer"
            >
              About
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setInfoModal('contact')}
              className="hover:text-slate-300 cursor-pointer"
            >
              Contact
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setInfoModal('terms')}
              className="hover:text-slate-300 cursor-pointer"
            >
              Terms &amp; Privacy
            </button>
          </div>
        </div>
      </footer>

      {/* Public Browse All Jobs Modal */}
      {showAllJobsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border border-[#1E293B] bg-[#0F172A] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#1E293B] px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-white">
                  Open Jobs &amp; Freelance Gigs in Bhutan
                </h3>
                <p className="text-xs text-slate-400">
                  {filteredModalJobs.length} live opportunities with clear tasks and deadlines
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllJobsModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center rounded-xl border border-[#1E293B] bg-[#0B111E] p-1.5">
                <Search className="ml-2.5 h-4 w-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by role, skill, company or dzongkhag..."
                  className="w-full bg-transparent px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {['All', ...JOB_TYPES].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      typeFilter === type
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#121C31] text-slate-300 border border-[#1E293B] hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {filteredModalJobs.length === 0 ? (
                  <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-8 text-center text-xs text-slate-400">
                    No matching live roles found. Try clearing your filter.
                  </div>
                ) : (
                  filteredModalJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#1E293B] bg-[#121C31] p-4 hover:border-blue-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <AvatarSquare label={job.title} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{job.title}</h4>
                            <StatusBadge status={job.status} />
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {job.company} · {job.location} · {job.salary} · Apply by {job.applyBy}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <TypeBadge type={job.type} />
                        <button
                          type="button"
                          onClick={() => {
                            setShowAllJobsModal(false);
                            setSelectedJob(job);
                          }}
                          className="rounded-lg border border-[#283652] bg-[#162138] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1D2B47] cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigateAuth('signup', 'seeker')}
                          className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
                        >
                          Apply now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Public Job Detail Modal */}
      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[#1E293B] bg-[#111A2E] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <AvatarSquare label={selectedJob.title} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{selectedJob.title}</h3>
                    <StatusBadge status={selectedJob.status} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedJob.company} · {selectedJob.location} · {selectedJob.salary} ·{' '}
                    {selectedJob.type}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B111E] px-2.5 py-1 border border-[#1E293B]">
                <MapPin className="h-3.5 w-3.5 text-blue-400" />
                {selectedJob.location}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B111E] px-2.5 py-1 border border-[#1E293B]">
                <Calendar className="h-3.5 w-3.5 text-blue-400" />
                Apply by {selectedJob.applyBy}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Task &amp; Role Description
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                  {selectedJob.description}
                </p>
              </div>
              {selectedJob.requirements.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Requirements
                  </h4>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate-300 list-disc pl-4">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1D2B47] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedJob(null);
                  onNavigateAuth('signup', 'seeker');
                }}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
              >
                Sign up to apply
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Info modal for About / Contact / Terms */}
      {infoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#1E293B] bg-[#111A2E] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h3 className="text-base font-semibold text-white">
                {infoModal === 'about'
                  ? 'About DrukLink'
                  : infoModal === 'contact'
                  ? 'Contact & Support'
                  : 'Terms & Privacy'}
              </h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 text-xs leading-relaxed text-slate-300 space-y-2.5">
              {infoModal === 'about' ? (
                <>
                  <p>
                    DrukLink connects job seekers, students, freelancers, and employers across all
                    twenty dzongkhags — from Thimphu start-ups to Bumthang farms.
                  </p>
                  <p>
                    Every post includes clear task descriptions, monthly pay in Ngultrum, status
                    (Open / Closed), and an explicit deadline.
                  </p>
                </>
              ) : infoModal === 'contact' ? (
                <>
                  <p>Live chat: Mon–Fri, 9am–5pm BST</p>
                  <p>Email: support@druklink.bt</p>
                  <p>Phone: +975 2 000 000 · Thimphu, Bhutan</p>
                </>
              ) : (
                <p>
                  We only share your profile with employers you apply to. You can export or delete
                  your data at any time from Account Settings.
                </p>
              )}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8] cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
