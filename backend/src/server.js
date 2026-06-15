require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const healthRoutes = require('./routes/healthRoutes');
const productsRoutes = require('./routes/productsRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const siteRoutes = require('./routes/siteRoutes');
const subscriberRoutes = require('./routes/subscriberRoutes');
const orderRoutes = require('./routes/orderRoutes');
const blogRoutes = require('./routes/blogRoutes');
const { ensureUserSchema } = require('./models/User');
const { ensureProductSchema } = require('./models/Product');
const { ensureSiteSettingsSchema } = require('./models/SiteSettings');
const { ensureSubscriberSchema } = require('./models/Subscriber');
const { ensureOrderSchema } = require('./models/Order');
const { ensureBlogPostSchema } = require('./models/BlogPost');
const { ensureInfluencerSchema } = require('./models/Influencer');
const { ensureReviewSchema } = require('./models/Review');
const adminInfluencerRoutes = require('./routes/adminInfluencerRoutes');


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
app.use(helmet({
  contentSecurityPolicy: false, // Disable if it interferes with your frontend static serving
}));

// CORS configuration - allow localhost for development
app.use(cors({
  origin: function (origin, cb) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return cb(null, true);
    // Allow localhost origins for development
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return cb(null, true);
    }
    // In production, check against allowed origins from env var
    const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

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

// Redirect the root path to the admin dashboard
app.get('/', (req, res) => {
  res.redirect('/admin.html');
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/admin', adminProductRoutes);
app.use('/api/admin/influencers', adminInfluencerRoutes);
app.use('/api', siteRoutes);
app.use('/api', subscriberRoutes);
app.use('/api', orderRoutes);
app.use('/api', blogRoutes);
app.use('/api', healthRoutes);

async function start() {
  try {
    await ensureProductSchema();
    await ensureSiteSettingsSchema();
    await ensureSubscriberSchema();
    await ensureOrderSchema();
    await ensureBlogPostSchema();
    await ensureReviewSchema();
    await ensureUserSchema();
    await ensureInfluencerSchema();
  } catch (err) {
    console.error('✗ Error during startup:', err.message);
    console.error('  Stack:', err.stack);
  }

  const port = Number(process.env.PORT || 8081);
  const server = app.listen(port, () => {
    console.log(`✓ API listening on http://localhost:${port}`);
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(`\n✓ Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('✓ HTTP server closed');
      process.exit(0);
    });
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('✗ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
