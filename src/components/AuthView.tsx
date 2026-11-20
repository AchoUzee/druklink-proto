import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { UserRole } from '../types.ts';
import { DrukLinkLogo } from './UI.tsx';

interface AuthViewProps {
  mode: 'login' | 'signup';
  role: UserRole;
  onChangeMode: (mode: 'login' | 'signup') => void;
  onChangeRole: (role: UserRole) => void;
  onBackHome: () => void;
  onLogin: (email: string, password: string, role: UserRole) => Promise<void>;
  onSignup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  onQuickDemoLogin: (role: UserRole) => Promise<void>;
}

export function AuthView({
  mode,
  role,
  onChangeMode,
  onChangeRole,
  onBackHome,
  onLogin,
  onSignup,
  onQuickDemoLogin,
}: AuthViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isProvider = role === 'provider';
  const isSignup = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isSignup) {
        await onSignup(name, email, password, role);
      } else {
        await onLogin(email, password, role);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0B111E] text-slate-100">
      {/* Left Deep Royal Blue Brand Panel */}
      <div className="bg-gradient-to-br from-[#162F76] via-[#132863] to-[#0E1E4E] p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/10">
        <div className="flex items-center justify-between">
          <DrukLinkLogo onClick={onBackHome} />
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-200/80 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </button>
        </div>

        <div className="my-12 lg:my-0 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
            {isProvider
              ? 'Hire the right people, faster.'
              : 'Your next job is closer than you think.'}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-blue-100/75">
            {isProvider
              ? 'Post a role in four steps and review applicants in one place.'
              : 'Build a profile once and apply to roles across Bhutan in one tap.'}
          </p>
        </div>

        <p className="text-xs text-blue-200/60">© 2026 DrukLink</p>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-white">
            {isSignup ? 'Join DrukLink' : 'Welcome back'}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {isSignup ? 'Free in under a minute.' : 'Log in to pick up where you left off.'}
          </p>

          {/* Role Toggle Tabs */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setError('');
                onChangeRole('seeker');
              }}
              className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                !isProvider
                  ? 'border-blue-500/60 bg-[#16223B] text-white'
                  : 'border-[#1E293B] bg-[#0F172A] text-slate-400 hover:text-slate-200'
              }`}
            >
              I&apos;m looking for work
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                onChangeRole('provider');
              }}
              className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                isProvider
                  ? 'border-blue-500/60 bg-[#16223B] text-white'
                  : 'border-[#1E293B] bg-[#0F172A] text-slate-400 hover:text-slate-200'
              }`}
            >
              I&apos;m hiring
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {isSignup ? (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {isProvider ? 'Organisation name' : 'Full name'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isProvider ? 'e.g. Thimphu Tech Hub' : 'e.g. Tenzin Wangmo'}
                  className="w-full rounded-lg border border-[#1E293B] bg-[#121C31] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.bt"
                className="w-full rounded-lg border border-[#1E293B] bg-[#121C31] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-[#1E293B] bg-[#121C31] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#2563EB] py-2.5 text-xs font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting
                ? 'Please wait...'
                : isSignup
                ? 'Create my account'
                : 'Log in to DrukLink'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setError('');
                onChangeMode(isSignup ? 'login' : 'signup');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              {isSignup ? 'Already have an account? Log in' : 'New here? Create an account'}
            </button>
          </div>

          {/* Presentation convenience: 1-click demo accounts */}
          <div className="mt-7 border-t border-[#1E293B] pt-4">
            <p className="text-[11px] text-slate-500 mb-2">Quick presentation demo sign-in:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onQuickDemoLogin('seeker')}
                className="rounded-lg border border-[#1E293B] bg-[#121C31] px-2.5 py-2 text-[11px] font-medium text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors cursor-pointer"
              >
                Tenzin (Seeker)
              </button>
              <button
                type="button"
                onClick={() => onQuickDemoLogin('provider')}
                className="rounded-lg border border-[#1E293B] bg-[#121C31] px-2.5 py-2 text-[11px] font-medium text-slate-300 hover:border-blue-500/40 hover:text-white transition-colors cursor-pointer"
              >
                Thimphu Tech (Provider)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
