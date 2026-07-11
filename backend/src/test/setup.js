// Jest setup - keep it lightweight.

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

// Default DB fallbacks to avoid accidental crashes.
process.env.PGHOST = process.env.PGHOST || '';
process.env.PGUSER = process.env.PGUSER || '';
process.env.PGDATABASE = process.env.PGDATABASE || '';
process.env.PGPASSWORD = process.env.PGPASSWORD || '';
process.env.PGPORT = process.env.PGPORT || '';

// Supabase env vars - tests will mock uploadToSupabase; these should not be required.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';
process.env.SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'glowexpert-storage';

// Increase default Jest timeout for slower CI environments.
jest.setTimeout(30000);

