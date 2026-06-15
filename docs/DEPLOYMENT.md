# Deployment

Recommended: Docker Compose.

## Prerequisites
- Docker Desktop
- Docker Compose (bundled with Docker Desktop)

## Quick Start (Docker Compose)
From repository root (`c:/Users/hp/Desktop/glowexpert`):

1. Create environment file (if needed)
- Check `backend/.env`, `backend/.env.example`, and root `.env`.

2. Start services
- `docker-compose up --build`

3. Verify
- Backend health: `GET http://localhost:8081/api/health/health`
- API root redirects to frontend admin page (`/admin.html`).

## Configuration
The backend container expects database and auth settings via environment variables:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `DB_SSL`
- `CORS_ALLOWED_ORIGINS`

See:
- `docs/REQUIREMENTS.md`

## Notes on Database Migrations / Schema
- `backend/src/server.js` calls `ensure*Schema()` functions on startup.
- These functions are defined in the respective model files (and/or run schema creation).
- Additionally, SQL migrations exist under `backend/src/migrations/`.

## Reverse Proxy (nginx)
- There is an `nginx/` folder with `default.conf`.
- If you use nginx, point it to the backend and/or serve frontend.


