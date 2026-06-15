# Requirements

This repository is a Node.js + Express backend with a Postgres database, plus a static frontend.

## Runtime (Backend)
- Node.js: (see `backend/package.json`)
- Express
- PostgreSQL (`pg` library)
- JSON Web Tokens (JWT) via `jsonwebtoken`
- Auth: bcrypt for password hashing
- Validation: `zod`
- Security headers: `helmet`
- Logging: `morgan`
- File uploads: `multer`

Backend dependencies are defined in:
- `backend/package.json`

## Environment Variables
From `docker-compose.yml` and code usage.

### Docker Compose / Backend
- `NODE_ENV` (default: `development`)
- `PORT` (default: `8081`)
- `DB_HOST` (default: `db`)
- `DB_PORT` (default: `5432`)
- `DB_USER` (default: `glowexpert`)
- `DB_PASSWORD` (default: `glowexpert`)
- `DB_NAME` (default: `glowexpert`)
- `DB_SSL` (default: `false`)
  - If `true`, backend sets `ssl: { rejectUnauthorized: false }`
- `JWT_SECRET` (default: `change_me_super_secret`)
- `JWT_EXPIRES_IN` (default: `7d`)
- `CORS_ALLOWED_ORIGINS` (optional)
  - Comma-separated list of origins allowed in production.
  - Local dev always allows `http://localhost*` and `http://127.0.0.1*`.

## Render (Postgres) config
When using Render Postgres, set the following environment variables from your Render credentials:
- `DB_HOST` = Render **Hostname**
- `DB_PORT` = Render **Port** (usually `5432`)
- `DB_NAME` = Render **Database**
- `DB_USER` = Render **Username**
- `DB_PASSWORD` = Render **Password**
- `DB_SSL` = `true`
  - Render Postgres typically requires SSL.


## Database Bootstrap
- `backend/setup_db.sql` is used for initial database/user setup (see deployment docs).
- Migrations exist in `backend/src/migrations/`.

## Ports
- Postgres: `5432` (container exposes to host via compose)
- Backend API: `8081`

## Tooling / Dev
- `nodemon` for `npm run dev`


