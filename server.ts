import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createSeedDatabase } from './src/data/seed.ts';
import type {
  Application,
  ApplicationStatus,
  DatabaseState,
  Job,
  Message,
  NotificationItem,
  User,
  UserRole,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'druklink-db.json');

function loadDatabase(): DatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseState;
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.jobs)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load database file, resetting to seed:', err);
  }
  const seed = createSeedDatabase();
  saveDatabase(seed);
  return seed;
}

function saveDatabase(db: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function sanitizeUser(user: User): Omit<User, 'password'> {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '8mb' }));

  let db: DatabaseState = loadDatabase();

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Fetch synchronized state
  app.get('/api/state', (req, res) => {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : '';
    const currentUser = db.users.find((u) => u.id === userId) || null;

    const notifications = currentUser
      ? db.notifications
          .filter((n) => n.userId === currentUser.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];

    const messages = currentUser
      ? db.messages
          .filter((m) => m.fromUserId === currentUser.id || m.toUserId === currentUser.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];

    res.json({
      user: currentUser ? sanitizeUser(currentUser) : null,
      jobs: db.jobs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      applications: db.applications.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      notifications,
      messages,
      seekers: db.users.filter((u) => u.role === 'seeker').map(sanitizeUser),
      providers: db.users.filter((u) => u.role === 'provider').map(sanitizeUser),
    });
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password, role } = req.body as {
      email?: string;
      password?: string;
      role?: UserRole;
    };

    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      res.status(400).json({ error: 'Please enter both email and password.' });
      return;
    }

    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user || user.password !== password) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (role && user.role !== role) {
      res.status(403).json({
        error: `This email is registered as a ${
          user.role === 'seeker' ? 'Job seeker' : 'Job provider'
        }. Switch the role tab above to log in.`,
      });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  });

  // Auth: Sign up
  app.post('/api/auth/signup', (req, res) => {
    const { name, email, password, role, location } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      location?: string;
    };

    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const chosenRole: UserRole = role === 'provider' ? 'provider' : 'seeker';

    if (!cleanName) {
      res.status(400).json({
        error: chosenRole === 'provider' ? 'Organisation name is required.' : 'Full name is required.',
      });
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
      return;
    }

    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
      return;
    }

    const id = `user-${chosenRole}-${Date.now()}`;
    const chosenLocation = location || 'Thimphu';
    const newUser: User = {
      id,
      role: chosenRole,
      name: cleanName,
      email: cleanEmail,
      password,
      headline:
        chosenRole === 'provider'
          ? `Organization · ${chosenLocation} · Growing team`
          : `Job Seeker · ${chosenLocation}`,
      location: chosenLocation,
      experience: chosenRole === 'provider' ? '1–10 employees' : 'Entry / Freelance',
      industry: chosenRole === 'provider' ? 'Technology' : undefined,
      teamSize: chosenRole === 'provider' ? '1–10 employees' : undefined,
      skills: chosenRole === 'provider' ? ['Bhutan', 'Hiring'] : ['Communication', 'Dzongkha'],
      about:
        chosenRole === 'provider'
          ? `${cleanName} is hiring talented professionals and freelancers across Bhutan.`
          : `${cleanName} is looking for meaningful work and freelance opportunities across Bhutan.`,
      resumeName: chosenRole === 'seeker' ? `${cleanName.replace(/\s+/g, '_')}_CV.pdf` : undefined,
      jobAlerts: 'Daily',
      savedJobIds: [],
    };

    db.users.push(newUser);

    const welcomeNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: newUser.id,
      title:
        chosenRole === 'provider'
          ? `Welcome ${cleanName}! Post your first job in 4 steps.`
          : `Welcome ${cleanName}! Explore open jobs across 20 dzongkhags.`,
      timeLabel: 'Just now',
      read: false,
      targetSection: chosenRole === 'provider' ? 'post-job' : 'jobs',
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(welcomeNotif);

    saveDatabase(db);
    res.status(201).json({ user: sanitizeUser(newUser) });
  });

  // Update user profile, resume, or account settings
  app.put('/api/users/:id', (req, res) => {
    const userIndex = db.users.findIndex((u) => u.id === req.params.id);
    if (userIndex === -1) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const user = db.users[userIndex];
    const updates = req.body as Partial<User> & { newPassword?: string };

    if (typeof updates.name === 'string' && updates.name.trim()) {
      user.name = updates.name.trim();
    }
    if (typeof updates.headline === 'string') {
      user.headline = updates.headline.trim();
    }
    if (typeof updates.location === 'string' && updates.location.trim()) {
      user.location = updates.location.trim();
    }
    if (typeof updates.about === 'string') {
      user.about = updates.about.trim();
    }
    if (typeof updates.experience === 'string') {
      user.experience = updates.experience.trim();
    }
    if (Array.isArray(updates.skills)) {
      user.skills = updates.skills.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof updates.industry === 'string') {
      user.industry = updates.industry.trim();
    }
    if (typeof updates.teamSize === 'string') {
      user.teamSize = updates.teamSize.trim();
    }
    if (user.role === 'provider' && (updates.industry || updates.location || updates.teamSize)) {
      user.headline = `${user.industry || 'Organization'} · ${user.location} · ${
        user.teamSize || 'Growing team'
      }`;
    }
    if (typeof updates.resumeName === 'string') {
      user.resumeName = updates.resumeName;
      user.resumeUploadedAt = new Date().toISOString().slice(0, 10);
    }
    if (typeof updates.resumeDataUrl === 'string') {
      user.resumeDataUrl = updates.resumeDataUrl;
    }
    if (typeof updates.email === 'string' && updates.email.trim()) {
      user.email = updates.email.trim().toLowerCase();
    }
    if (typeof updates.newPassword === 'string' && updates.newPassword.length >= 8) {
      user.password = updates.newPassword;
    }
    if (updates.jobAlerts) {
      user.jobAlerts = updates.jobAlerts;
    }

    // Sync company name on provider jobs if org name changed
    if (user.role === 'provider' && updates.name) {
      db.jobs.forEach((j) => {
        if (j.providerId === user.id) {
          j.company = user.name;
        }
      });
    }

    saveDatabase(db);
    res.json({ user: sanitizeUser(user) });
  });

  // Toggle saved job
  app.post('/api/users/:id/saved-jobs', (req, res) => {
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { jobId } = req.body as { jobId?: string };
    if (!jobId) {
      res.status(400).json({ error: 'jobId is required.' });
      return;
    }

    if (user.savedJobIds.includes(jobId)) {
      user.savedJobIds = user.savedJobIds.filter((id) => id !== jobId);
    } else {
      user.savedJobIds.unshift(jobId);
    }

    saveDatabase(db);
    res.json({ savedJobIds: user.savedJobIds });
  });

  // Create a new job post
  app.post('/api/jobs', (req, res) => {
    const payload = req.body as Partial<Job>;
    if (!payload.providerId || !payload.title || !payload.location) {
      res.status(400).json({ error: 'Job title, provider, and location are required.' });
      return;
    }

    const provider = db.users.find((u) => u.id === payload.providerId);
    const newJob: Job = {
      id: `job-${Date.now()}`,
      providerId: payload.providerId,
      company: payload.company || provider?.name || 'Bhutan Employer',
      title: payload.title.trim(),
      category: payload.category || 'Design',
      type: payload.type || 'Full-time',
      location: payload.location,
      salary: (payload.salary || 'Negotiable').trim(),
      description:
        (payload.description || '').trim() ||
        'Join our team in Bhutan. Full role details provided during shortlisting.',
      requirements:
        Array.isArray(payload.requirements) && payload.requirements.length > 0
          ? payload.requirements
          : ['Relevant skills and commitment to clear deadlines'],
      applyBy: payload.applyBy || '2026-12-30',
      status: 'Live',
      views: 1,
      featured: false,
      createdAt: new Date().toISOString(),
    };

    db.jobs.unshift(newJob);

    // Notify job seekers about the fresh match
    db.users
      .filter((u) => u.role === 'seeker')
      .forEach((seeker) => {
        db.notifications.unshift({
          id: `notif-${Date.now()}-${seeker.id}`,
          userId: seeker.id,
          title: `New match: ${newJob.title} in ${newJob.location}`,
          timeLabel: 'Just now',
          read: false,
          targetSection: 'jobs',
          targetTab: 'Job Details',
          relatedId: newJob.id,
          createdAt: new Date().toISOString(),
        });
      });

    // Notify provider that job is live
    db.notifications.unshift({
      id: `notif-${Date.now()}-pub`,
      userId: newJob.providerId,
      title: `Your job "${newJob.title}" is now live`,
      timeLabel: 'Just now',
      read: false,
      targetSection: 'manage-jobs',
      targetTab: 'My Job Posts',
      relatedId: newJob.id,
      createdAt: new Date().toISOString(),
    });

    saveDatabase(db);
    res.status(201).json({ job: newJob });
  });

  // Update job post
  app.put('/api/jobs/:id', (req, res) => {
    const job = db.jobs.find((j) => j.id === req.params.id);
    if (!job) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    const updates = req.body as Partial<Job>;
    if (typeof updates.title === 'string' && updates.title.trim()) job.title = updates.title.trim();
    if (updates.category) job.category = updates.category;
    if (updates.type) job.type = updates.type;
    if (typeof updates.location === 'string' && updates.location.trim()) job.location = updates.location;
    if (typeof updates.salary === 'string' && updates.salary.trim()) job.salary = updates.salary.trim();
    if (typeof updates.description === 'string') job.description = updates.description.trim();
    if (Array.isArray(updates.requirements)) job.requirements = updates.requirements;
    if (typeof updates.applyBy === 'string') job.applyBy = updates.applyBy;
    if (updates.status === 'Live' || updates.status === 'Closed') job.status = updates.status;

    saveDatabase(db);
    res.json({ job });
  });

  // Delete job post
  app.delete('/api/jobs/:id', (req, res) => {
    const idx = db.jobs.findIndex((j) => j.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }
    const [removed] = db.jobs.splice(idx, 1);
    db.applications = db.applications.filter((a) => a.jobId !== removed.id);
    saveDatabase(db);
    res.json({ deletedId: removed.id });
  });

  // Increment job view
  app.post('/api/jobs/:id/view', (req, res) => {
    const job = db.jobs.find((j) => j.id === req.params.id);
    if (job) {
      job.views += 1;
      saveDatabase(db);
    }
    res.json({ ok: true });
  });

  // Submit job application
  app.post('/api/applications', (req, res) => {
    const { jobId, seekerId, seekerName, seekerEmail, resumeName, resumeDataUrl, coverNote } =
      req.body as {
        jobId?: string;
        seekerId?: string;
        seekerName?: string;
        seekerEmail?: string;
        resumeName?: string;
        resumeDataUrl?: string;
        coverNote?: string;
      };

    if (!jobId || !seekerId) {
      res.status(400).json({ error: 'jobId and seekerId are required.' });
      return;
    }

    const job = db.jobs.find((j) => j.id === jobId);
    if (!job) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }
    if (job.status === 'Closed') {
      res.status(400).json({ error: 'This role is already closed for applications.' });
      return;
    }

    const alreadyApplied = db.applications.find(
      (a) => a.jobId === jobId && a.seekerId === seekerId,
    );
    if (alreadyApplied) {
      res.status(409).json({ error: 'You have already applied to this role.' });
      return;
    }

    const seeker = db.users.find((u) => u.id === seekerId);
    const now = new Date().toISOString();
    const newApp: Application = {
      id: `app-${Date.now()}`,
      jobId,
      seekerId,
      seekerName: (seekerName || seeker?.name || 'Applicant').trim(),
      seekerEmail: (seekerEmail || seeker?.email || '').trim(),
      seekerLocation: seeker?.location || 'Thimphu',
      seekerExperience: seeker?.experience || '1+ yrs experience',
      seekerSkills: seeker?.skills || ['Communication', 'Dzongkha'],
      resumeName: resumeName || seeker?.resumeName || 'Applicant_CV.pdf',
      resumeDataUrl: resumeDataUrl || seeker?.resumeDataUrl,
      coverNote:
        (coverNote || '').trim() ||
        'Excited to contribute to your team and deliver quality work on schedule.',
      status: 'Under review',
      createdAt: now,
      updatedAt: now,
    };

    db.applications.unshift(newApp);

    // Notify job provider
    db.notifications.unshift({
      id: `notif-${Date.now()}-prov`,
      userId: job.providerId,
      title: `${newApp.seekerName} applied for ${job.title}`,
      timeLabel: 'Just now',
      read: false,
      targetSection: 'applications',
      targetTab: 'Applicant Profile',
      relatedId: newApp.id,
      createdAt: now,
    });

    // Notify seeker confirmation
    db.notifications.unshift({
      id: `notif-${Date.now()}-seek`,
      userId: seekerId,
      title: `Application submitted for ${job.title} at ${job.company}`,
      timeLabel: 'Just now',
      read: false,
      targetSection: 'dashboard',
      targetTab: 'My Applications',
      relatedId: newApp.id,
      createdAt: now,
    });

    saveDatabase(db);
    res.status(201).json({ application: newApp });
  });

  // Update application status (Shortlist, Interview, Accept, Reject)
  app.patch('/api/applications/:id', (req, res) => {
    const application = db.applications.find((a) => a.id === req.params.id);
    if (!application) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }

    const { status } = req.body as { status?: ApplicationStatus };
    if (!status) {
      res.status(400).json({ error: 'Status is required.' });
      return;
    }

    application.status = status;
    application.updatedAt = new Date().toISOString();

    const job = db.jobs.find((j) => j.id === application.jobId);
    const jobTitle = job?.title || 'your role';
    const company = job?.company || 'an employer';

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: application.seekerId,
      title: `Application update: ${status} for ${jobTitle} at ${company}`,
      timeLabel: 'Just now',
      read: false,
      targetSection: 'dashboard',
      targetTab: 'My Applications',
      relatedId: application.id,
      createdAt: new Date().toISOString(),
    });

    saveDatabase(db);
    res.json({ application });
  });

  // Send message (Provider <-> Seeker)
  app.post('/api/messages', (req, res) => {
    const { fromUserId, fromName, toUserId, toName, jobId, jobTitle, subject, body } =
      req.body as Partial<Message>;

    if (!fromUserId || !toUserId || !body?.trim()) {
      res.status(400).json({ error: 'Recipient and message body are required.' });
      return;
    }

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      fromUserId,
      fromName: fromName || 'DrukLink User',
      toUserId,
      toName: toName || 'Recipient',
      jobId,
      jobTitle,
      subject: (subject || 'Message via DrukLink').trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
    };

    db.messages.unshift(newMsg);

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: toUserId,
      title: `New message from ${newMsg.fromName}: ${newMsg.subject}`,
      timeLabel: 'Just now',
      read: false,
      targetSection: 'dashboard',
      targetTab: 'Notifications',
      createdAt: new Date().toISOString(),
    });

    saveDatabase(db);
    res.status(201).json({ message: newMsg });
  });

  // Mark notification(s) as read
  app.patch('/api/notifications/:id/read', (req, res) => {
    if (req.params.id === 'all') {
      const { userId } = req.body as { userId?: string };
      db.notifications.forEach((n) => {
        if (!userId || n.userId === userId) {
          n.read = true;
        }
      });
      saveDatabase(db);
      res.json({ ok: true });
      return;
    }

    const notif = db.notifications.find((n) => n.id === req.params.id);
    if (notif) {
      notif.read = true;
      saveDatabase(db);
    }
    res.json({ ok: true });
  });

  // Submit support / contact form
  app.post('/api/support', (req, res) => {
    const { userId, name, email, topic, message } = req.body as {
      userId?: string;
      name?: string;
      email?: string;
      topic?: string;
      message?: string;
    };

    if (!message?.trim()) {
      res.status(400).json({ error: 'Please enter a message.' });
      return;
    }

    const ticket = {
      id: `ticket-${Date.now()}`,
      userId,
      name: (name || 'DrukLink User').trim(),
      email: (email || '').trim(),
      topic: topic || 'General question',
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };
    db.supportTickets.unshift(ticket);
    saveDatabase(db);
    res.status(201).json({ ticket });
  });

  // Reset demo data if requested during presentation
  app.post('/api/demo/reset', (_req, res) => {
    db = createSeedDatabase();
    saveDatabase(db);
    res.json({ ok: true });
  });

  // Vite dev middleware or static production files
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`DrukLink server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DrukLink server:', err);
  process.exit(1);
});
