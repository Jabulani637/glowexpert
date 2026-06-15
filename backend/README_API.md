# GlowExpert API (JWT) - Auth (register/login)

## Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET  /api/health`

## Auth model
- `users.role` is a **string**: `customer | admin | influencer`

## Prerequisites
- PostgreSQL schema installed (run `src/migrations/001_create_users.sql`)

### Quick schema apply (psql)
Replace connection details as needed.
```bash
psql "postgresql://glowexpert:glowexpert@localhost:5432/glowexpert" -f src/migrations/001_create_users.sql
```

## Run server
```bash
cd backend
cp -n .env.example .env || true
npm install
npm run dev
```

## Register (example)
```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Amara",
    "email":"amara@example.com",
    "password":"supersecret123",
    "role":"customer"
  }'
```

## Login (example)
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"amara@example.com",
    "password":"supersecret123"
  }'
```

Response contains:
- `access_token` (JWT)
- `token_type` = Bearer

