export type UserRole = 'seeker' | 'provider';

export type JobType = 'Full-time' | 'Part-time' | 'Remote' | 'Freelance' | 'Contract';

export type JobCategory =
  | 'Design'
  | 'Engineering'
  | 'Tourism'
  | 'Finance'
  | 'Agriculture'
  | 'Education'
  | 'Health'
  | 'Media';

export type ApplicationStatus =
  | 'New'
  | 'Under review'
  | 'Shortlisted'
  | 'Interview'
  | 'Accepted'
  | 'Rejected';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  password: string;
  headline: string;
  location: string;
  about: string;
  skills: string[];
  experience: string;
  industry?: string;
  teamSize?: string;
  resumeName?: string;
  resumeDataUrl?: string;
  resumeUploadedAt?: string;
  jobAlerts?: 'Daily' | 'Weekly' | 'Instant' | 'Off';
  savedJobIds: string[];
}

export interface Job {
  id: string;
  providerId: string;
  company: string;
  title: string;
  category: JobCategory;
  type: JobType;
  location: string;
  salary: string;
  description: string;
  requirements: string[];
  applyBy: string;
  status: 'Live' | 'Closed';
  views: number;
  featured?: boolean;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  seekerLocation: string;
  seekerExperience: string;
  seekerSkills: string[];
  resumeName: string;
  resumeDataUrl?: string;
  coverNote: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  jobId?: string;
  jobTitle?: string;
  subject: string;
  body: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  timeLabel: string;
  read: boolean;
  targetSection?: string;
  targetTab?: string;
  relatedId?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId?: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
}

export interface DatabaseState {
  users: User[];
  jobs: Job[];
  applications: Application[];
  messages: Message[];
  notifications: NotificationItem[];
  supportTickets: SupportTicket[];
}

export const BHUTAN_DZONGKHAGS = [
  'Thimphu',
  'Paro',
  'Phuentsholing',
  'Punakha',
  'Wangdue Phodrang',
  'Bumthang',
  'Trongsa',
  'Mongar',
  'Trashigang',
  'Trashiyangtse',
  'Samdrup Jongkhar',
  'Samtse',
  'Sarpang',
  'Gelephu',
  'Chhukha',
  'Dagana',
  'Gasa',
  'Haa',
  'Lhuentse',
  'Pemagatshel',
  'Tsirang',
  'Zhemgang',
  'Remote',
] as const;

export const JOB_CATEGORIES: { name: JobCategory; letter: string; baseCount: number }[] = [
  { name: 'Design', letter: 'D', baseCount: 7 },
  { name: 'Engineering', letter: 'E', baseCount: 14 },
  { name: 'Tourism', letter: 'T', baseCount: 9 },
  { name: 'Finance', letter: 'F', baseCount: 21 },
  { name: 'Agriculture', letter: 'A', baseCount: 27 },
  { name: 'Education', letter: 'E', baseCount: 32 },
  { name: 'Health', letter: 'H', baseCount: 37 },
  { name: 'Media', letter: 'M', baseCount: 42 },
];

export const JOB_TYPES: JobType[] = ['Full-time', 'Part-time', 'Remote', 'Freelance', 'Contract'];
