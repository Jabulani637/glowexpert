require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const productsRoutes = require('./routes/productsRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');

const siteRoutes = require('./routes/siteRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const orderRoutes = require('./routes/orderRoutes');
const influencerRoutes = require('./routes/influencerRoutes');
const blogRoutes = require('./routes/blogRoutes');
const publicBlogSeoRoutes = require('./routes/publicBlogSeoRoutes');

const { ensureUserSchema, ensureAdminUser } = require('./models/User');
const { ensureProductSchema } = require('./models/Product');
const { ensureSiteSettingsSchema } = require('./models/SiteSettings');
const { ensureSubscriberSchema } = require('./models/Subscriber');
const { ensureOrderSchema } = require('./models/Order');
const { ensureBlogPostSchema } = require('./models/BlogPost');
const { ensureInfluencerSchema } = require('./models/Influencer');
const { ensureReviewSchema } = require('./models/Review');
const adminInfluencerRoutes = require('./routes/adminInfluencerRoutes');
const adminMediaRoutes = require('./routes/adminMediaRoutes');
const helpCentreRoutes = require('./routes/helpCentreRoutes');

// Create uploads directory if it doesn't exist.
// On some platforms (e.g., Vercel), the filesystem may be read-only or disallow writes.
const uploadsDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  // Do not crash the app on startup if we cannot create the uploads directory.
  console.warn('! Could not create uploads directory:', uploadsDir);
  console.warn('  ', err.message);
}

const app = express();

// Production Security Headers
// Keep CSP disabled because this app serves multiple HTML files and likely uses inline scripts.
// If you switch to a stricter frontend build, enable and tune CSP.
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

function getAllowedOrigins() {
  const allowedEnv = (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || '');
  const allowedFromEnv = allowedEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Hardcoded fallback for the known Vercel frontend origin.
  // Prevents OTP/CORS failures when env vars are not set correctly.
  // NOTE: Express CORS expects the *full origin* (including scheme),
  // because we compare against `origin` exactly.
  const allowedFallback = [
    'https://glowexpert.vercel.app',
    'http://glowexpert.vercel.app',
    // Also accept the bare hostname defensively (in case env values are mis-set)
    'glowexpert.vercel.app'
  ];

  return [...new Set([...allowedFromEnv, ...allowedFallback])];
}

// CORS configuration - allow localhost for development and FRONTEND_URL from .env
app.options('*', cors());

app.use(
  cors({
    origin: function (origin, cb) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return cb(null, true);

      // Allow localhost origins for development
      if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
        return cb(null, true);
      }

      const allowed = getAllowedOrigins();
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting: generous global cap so the API can't be trivially hammered,
// plus a tighter limit on auth endpoints (on top of the existing per-account
// failed-login lockout in authController, which protects a single account).
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
  })
);

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again later.' }
  })
);

// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Serve frontend statically (assuming files like admin.html are in the frontend folder)
const frontendDir = path.join(__dirname, '..', '..', 'frontend');
if (fs.existsSync(frontendDir)) {
  console.log(`✓ Serving frontend from: ${frontendDir}`);
  app.use(express.static(frontendDir));
} else {
  console.warn(`! Frontend directory not found at: ${frontendDir}`);
}

// Redirect the root path to the storefront (SEO-friendly)
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.use('/api/auth', authRoutes);

// Clerk middleware: verifies Clerk auth tokens if present.
// For admin-only endpoints we enforce role in the route handlers.
const { clerkMiddleware } = require('./auth/clerkMiddleware');
// apply only to /api/admin and /api/influencer*? We'll leave route modules to enforce.
app.use('/api', clerkMiddleware());

app.use('/api/products', productsRoutes);
app.use('/api/admin', adminProductRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin/influencers', adminInfluencerRoutes);
app.use('/api/admin/media', adminMediaRoutes);
app.use('/api/influencer', influencerRoutes);

app.use('/api', siteRoutes);
app.use('/api', subscriberRoutes);
app.use('/api', orderRoutes);
app.use('/api', blogRoutes);
app.use('/api', helpCentreRoutes);
app.use('/api', healthRoutes);

// SEO-friendly server-rendered blog shell (optional but improves indexing)
app.use('/blog', publicBlogSeoRoutes);

// JSON 404 for any unmatched /api/* route

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Global error handler - ensures unexpected errors return JSON, not an HTML stack trace
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  res.status(err?.status || 500).json({ message: 'Internal server error' });
});

async function start() {
  // Ensure help-centre table exists
  const { ensureHelpCentreMessageSchema } = require('./models/HelpCentreMessage');
  await ensureHelpCentreMessageSchema();

  // Log effective CORS allowlist (helps confirm what the *running* server is using)
  console.log('ℹ︎ CORS_ALLOWED_ORIGINS:', process.env.CORS_ALLOWED_ORIGINS);
  console.log('ℹ︎ FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('ℹ︎ Effective allowed origins:', getAllowedOrigins());

  const startupSteps = [
    ['products', ensureProductSchema],
    ['site settings', ensureSiteSettingsSchema],
    ['subscribers', ensureSubscriberSchema],
    ['orders', ensureOrderSchema],
    ['blog posts', ensureBlogPostSchema],
    ['reviews', ensureReviewSchema],
    ['users', ensureUserSchema],
    ['influencers', ensureInfluencerSchema]
  ];

  for (const [label, step] of startupSteps) {
    try {
      await step();
      console.log(`✓ ${label} schema ready`);
    } catch (err) {
      console.warn(`! ${label} schema check skipped:`, err.message);
    }
  }

  try {
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminCell = process.env.ADMIN_CELLPHONE;

    // CRITICAL: never fall back to a known default password.
    // If not configured, skip seeding and require an explicit provisioning step.
    if (!adminEmail || !adminPassword) {
      console.warn(
        '! Skipping admin seeding: ADMIN_EMAIL and ADMIN_PASSWORD must be set to provision the initial admin safely.'
      );
    } else {
      await ensureAdminUser({
        name: 'GlowExpert Admin',
        email: adminEmail,
        cellphone: adminCell || null,
        passwordHash: await bcrypt.hash(adminPassword, 12),
        role: 'admin'
      });
      console.log(`✓ Seeded admin account for ${adminEmail}`);
    }
  } catch (seedErr) {
    console.warn('! Could not seed admin account:', seedErr.message);
  }

  const preferredPort = Number(process.env.PORT || process.env.BACKEND_PORT || 8081);

  const registerShutdown = (server) => {
    const shutdown = (signal) => {
      console.log(`\n✓ Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('✓ HTTP server closed');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('✗ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  };

  const listenOnPort = (port, attempt = 1) => {
    const server = app.listen(port, () => {
      console.log(`✓ API listening on http://localhost:${port}`);
      registerShutdown(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = port + 1;
        if (attempt <= 5) {
          console.warn(`! Port ${port} is busy. Trying ${nextPort}...`);
          server.close(() => listenOnPort(nextPort, attempt + 1));
        } else {
          console.error(`✗ No available port found after trying ${port}`);
          process.exit(1);
        }
        return;
      }

      console.error('✗ Failed to start server:', err.message);
      process.exit(1);
    });
  };

  listenOnPort(preferredPort);
}

start();

