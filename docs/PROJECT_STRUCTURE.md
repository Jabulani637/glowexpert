# Project Structure (High Level)

Repository root
- `docker-compose.yml` orchestration
- `backend/` Node.js/Express API
- `frontend/` static client pages
- `nginx/` reverse proxy configuration
- `docs/` documentation (created in this task)

## Backend (`backend/`)
- `src/server.js`
  - Express app setup
  - mounts routes under `/api/*`
  - serves frontend and `/uploads`
  - runs schema ensure calls on startup

- `src/routes/`
  - Express route groups

- `src/controllers/`
  - Request handlers performing business logic

- `src/models/`
  - Database queries + schema ensure functions (`ensure*Schema`)

- `src/auth/`
  - JWT signing and roles helpers

- `src/middleware/`
  - Auth/authorization middleware

- `src/validation/`
  - zod schemas for request validation

- `src/migrations/`
  - SQL migration scripts


