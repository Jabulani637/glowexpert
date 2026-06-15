# GlowExpert Backend (Node.js + JWT) - Local Setup

## 1) Requirements
- Node.js 18+
- PostgreSQL running

## 2) Create DB
Create a PostgreSQL database named `glowexpert` (or update `.env`).

## 3) Apply migration
Run the SQL migration:
```bash
psql "postgresql://glowexpert:glowexpert@localhost:5432/glowexpert" -f src/migrations/001_create_users.sql
```

## 4) Configure env
Copy env example:
```bash
cp .env.example .env
```

## 5) Install deps & run
```bash
npm install
npm run dev
```

Server:
- `http://localhost:8081`

## 6) Test endpoints
Register:
```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Amara","email":"amara@example.com","password":"supersecret123","role":"customer"}'
```

Login:
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"amara@example.com","password":"supersecret123"}'
```

