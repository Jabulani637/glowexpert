# GlowExpert - Backend (Dockerized Laravel)

## Start everything
From repo root (`glowexpert-`):

```bash
docker compose up -d --build
```

## Create Laravel inside `backend/`
```bash
docker compose exec app sh -lc "composer create-project laravel/laravel /var/www/html --no-interaction"
```

## Create `.env`
If needed:
```bash
docker compose exec app sh -lc "cp -n .env.example .env 2>/dev/null || true"
```

## Next step
After Laravel exists, we will:
- enable CORS
- set up Laravel Sanctum auth flows
- add `users.role` (string) and role-based middleware
- add migrations/models/controllers/middleware/routes + validation

