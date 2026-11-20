import type {
  Application,
  ApplicationStatus,
  Job,
  Message,
  NotificationItem,
  User,
  UserRole,
} from './types.ts';

export type SafeUser = Omit<User, 'password'>;

export interface AppStateResponse {
  user: SafeUser | null;
  jobs: Job[];
  applications: Application[];
  notifications: NotificationItem[];
  messages: Message[];
  seekers: SafeUser[];
  providers: SafeUser[];
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

export const api = {
  getState: (userId?: string) =>
    request<AppStateResponse>(
      `/api/state${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`,
    ),

  login: (payload: { email: string; password: string; role?: UserRole }) =>
    request<{ user: SafeUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  signup: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    location?: string;
  }) =>
    request<{ user: SafeUser }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUser: (userId: string, payload: Partial<User> & { newPassword?: string }) =>
    request<{ user: SafeUser }>(`/api/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  toggleSavedJob: (userId: string, jobId: string) =>
    request<{ savedJobIds: string[] }>(`/api/users/${encodeURIComponent(userId)}/saved-jobs`, {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    }),

  createJob: (payload: Partial<Job>) =>
    request<{ job: Job }>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateJob: (jobId: string, payload: Partial<Job>) =>
    request<{ job: Job }>(`/api/jobs/${encodeURIComponent(jobId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteJob: (jobId: string) =>
    request<{ deletedId: string }>(`/api/jobs/${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
    }),

  trackJobView: (jobId: string) =>
    request<{ ok: boolean }>(`/api/jobs/${encodeURIComponent(jobId)}/view`, {
      method: 'POST',
    }),

  applyForJob: (payload: {
    jobId: string;
    seekerId: string;
    seekerName: string;
    seekerEmail: string;
    resumeName: string;
    resumeDataUrl?: string;
    coverNote: string;
  }) =>
    request<{ application: Application }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateApplicationStatus: (appId: string, status: ApplicationStatus) =>
    request<{ application: Application }>(`/api/applications/${encodeURIComponent(appId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  sendMessage: (payload: {
    fromUserId: string;
    fromName: string;
    toUserId: string;
    toName: string;
    jobId?: string;
    jobTitle?: string;
    subject: string;
    body: string;
  }) =>
    request<{ message: Message }>('/api/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  markNotificationRead: (notifId: string, userId?: string) =>
    request<{ ok: boolean }>(`/api/notifications/${encodeURIComponent(notifId)}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ userId }),
    }),

  submitSupport: (payload: {
    userId?: string;
    name: string;
    email: string;
    topic: string;
    message: string;
  }) =>
    request<{ ok: boolean }>('/api/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetDemo: () =>
    request<{ ok: boolean }>('/api/demo/reset', {
      method: 'POST',
    }),
};
