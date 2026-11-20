import React, { useState } from 'react';
import { CheckCircle2, FileText, X } from 'lucide-react';
import type { ApplicationStatus } from '../types.ts';

export function DrukLinkLogo({
  onClick,
  badge,
}: {
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#3B82F6] text-xs font-bold text-white shadow-sm group-hover:bg-[#2563EB] transition-colors">
          D
        </span>
        <span className="text-[15px] font-bold tracking-tight text-white">DrukLink</span>
      </button>
      {badge ? (
        <span className="rounded-full bg-[#1B2B4B] px-2.5 py-0.5 text-[11px] font-medium text-blue-300 border border-blue-500/20">
          {badge}
        </span>
      ) : null}
    </div>
  );
}

export function AvatarSquare({
  label,
  size = 'md',
}: {
  label: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const initial = (label || 'D').trim().charAt(0).toUpperCase();
  const sizeClass =
    size === 'lg'
      ? 'h-12 w-12 text-base rounded-xl'
      : size === 'sm'
      ? 'h-8 w-8 text-xs rounded-lg'
      : 'h-10 w-10 text-sm rounded-lg';

  return (
    <div
      className={`${sizeClass} shrink-0 flex items-center justify-center bg-[#1A2946] text-blue-300 font-semibold border border-[#26385C]`}
    >
      {initial}
    </div>
  );
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#1A253B] px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700/60">
      {type}
    </span>
  );
}

export function StatusBadge({ status }: { status: ApplicationStatus | 'Live' | 'Closed' | string }) {
  let classes = 'bg-slate-700/40 text-slate-300 border-slate-600/40';
  if (
    status === 'Live' ||
    status === 'Interview' ||
    status === 'Accepted' ||
    status === 'Open'
  ) {
    classes = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
  } else if (status === 'Under review' || status === 'New') {
    classes = 'bg-amber-500/15 text-amber-400 border-amber-500/25';
  } else if (status === 'Shortlisted') {
    classes = 'bg-blue-500/15 text-blue-300 border-blue-500/25';
  } else if (status === 'Rejected' || status === 'Closed') {
    classes = 'bg-rose-500/15 text-rose-400 border-rose-500/25';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${classes}`}
    >
      {status}
    </span>
  );
}

export function BarChart7Days({
  title,
  values,
  labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
}: {
  title: string;
  values: number[];
  labels?: string[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const max = Math.max(...values, 1);

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#121C31] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium text-slate-300">{title}</p>
        {hoveredIdx !== null ? (
          <span className="text-xs font-medium text-blue-300">
            {labels[hoveredIdx]}: {values[hoveredIdx]}
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">Last 7 days</span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-3 items-end h-28 pt-2">
        {values.map((val, idx) => {
          const pct = Math.max(18, Math.round((val / max) * 100));
          return (
            <div
              key={labels[idx] || idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex flex-col items-center justify-end h-full group cursor-pointer"
            >
              <div
                style={{ height: `${pct}%` }}
                className="w-full rounded-t-md bg-[#4F75E8] group-hover:bg-[#6088FA] transition-all duration-200"
                title={`${labels[idx]}: ${val}`}
              />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 gap-3 mt-2">
        {labels.map((lbl) => (
          <span key={lbl} className="text-center text-[11px] text-slate-500">
            {lbl}
          </span>
        ))}
      </div>
    </div>
  );
}

export function SubTabBar({
  tabs,
  active,
  onSelect,
}: {
  tabs: string[];
  active: string;
  onSelect: (tab: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onSelect(tab)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'bg-[#121C31] text-slate-300 border border-[#1E293B] hover:border-slate-600 hover:text-white'
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

export function ToastBanner({
  toast,
  onClose,
}: {
  toast: { message: string; type?: 'success' | 'error' } | null;
  onClose: () => void;
}) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-[#283652] bg-[#131F37] px-4 py-3 text-sm text-slate-100 shadow-2xl">
      <CheckCircle2 className={`h-4 w-4 shrink-0 ${isErr ? 'text-rose-400' : 'text-emerald-400'}`} />
      <span>{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-slate-400 hover:text-white cursor-pointer"
        aria-label="Close notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ResumeModal({
  isOpen,
  onClose,
  ownerName,
  resumeName,
  resumeDataUrl,
  headline,
  location,
  skills,
  about,
}: {
  isOpen: boolean;
  onClose: () => void;
  ownerName: string;
  resumeName?: string;
  resumeDataUrl?: string;
  headline?: string;
  location?: string;
  skills?: string[];
  about?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-[#1E293B] bg-[#111A2E] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {resumeName || `${ownerName.replace(/\s+/g, '_')}_CV.pdf`}
              </h3>
              <p className="text-xs text-slate-400">
                {ownerName} {location ? `· ${location}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div className="rounded-xl border border-[#1E293B] bg-[#0B111E] p-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Candidate Summary
            </p>
            <p className="font-medium text-white">{ownerName}</p>
            {headline ? <p className="text-xs text-slate-300">{headline}</p> : null}
            {about ? <p className="text-xs leading-relaxed text-slate-400">{about}</p> : null}
            {skills && skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[#192641] px-2.5 py-0.5 text-[11px] text-blue-200 border border-[#26385C]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            {resumeDataUrl ? (
              <a
                href={resumeDataUrl}
                download={resumeName || 'resume.pdf'}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-medium text-white hover:bg-[#1D4ED8]"
              >
                Download uploaded file
              </a>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#283652] bg-[#162138] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-[#1D2B47] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
