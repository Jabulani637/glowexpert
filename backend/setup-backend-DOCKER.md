# GlowExpert Backend (Docker + Laravel + Postgres + Redis)

## What this sets up
- Docker Compose stack with 4 containers:
  - `app` (PHP 8.3 FPM, Composer)
  - `nginx` (serves Laravel `public/`)
  - `postgres`
  - `redis`
- A Laravel project will be created inside `backend/` on first run.

## Prerequisites
- Docker Desktop installed
- Docker Compose available (`docker compose`)

## 1) Start containers
From repo root (`glowexpert-`):
```bash
docker compose up -d --build
```

## 2) Create Laravel project inside `backend/`
Once containers are up:
```bash
docker compose exec app sh -lc \
  "composer create-project laravel/laravel /var/www/html --no-interaction"
```

This will install Laravel and create:
- `backend/app`, `backend/routes`, `backend/public`, etc.

## 3) Environment config
Copy example env into the Laravel `.env`:
```bash
docker compose exec app sh -lc \
  "if [ -f .env.example ] && [ ! -f .env ]; then cp .env.example .env; fi"
```

If you prefer, edit `backend/.env` after it exists.

## 4) Install and configure Sanctum auth + role-based access
After Laravel exists, we will run artisan commands inside the `app` container.

Commands will be added to the next step after you confirm you already created the Laravel folder structure successfully.

## Expected URLs
- Nginx: http://localhost:8080
- Laravel health: `GET /` should show Laravel default page until routes are configured.

## Notes for Kubernetes readiness
- Service discovery uses hostnames: `postgres`, `redis`, `app`
- No hard-coded local IPs in configs
- All config is environment-driven via `.env`

