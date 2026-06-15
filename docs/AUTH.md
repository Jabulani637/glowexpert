# Authentication & Authorization

## JWT
- JWT is created via `backend/src/auth/jwt.js`.
- Claims used in login:
  - `sub` (user id)
  - `email`
  - `name`
  - `role`

Auth middleware is applied in admin routes:
- `backend/src/auth/middlewareAuth.js` and/or
- `backend/src/middleware/auth.js`

Admin-only gating:
- `backend/src/auth/roles.js` -> `requireRoles(['admin'])`
- or `ensureAdmin` / `requireAdmin`

## Password Auth (Customer)
Implemented in `backend/src/controllers/authController.js`:
- Passwords stored as bcrypt hashes.
- Login accepts either:
  - email-like string (contains `@` and `.`)
  - or cellphone-like value (normalized)

Cellphone normalization:
- trims
- removes non-digit characters except `+`
- converts leading `00` to `+`
- if `0XXXXXXXXX` (UK style), converts to `+44...`

## Admin OTP Auth
Implemented in:
- `backend/src/controllers/authController.js` (`login` for admin)
- `backend/src/controllers/authOtpController.js` (`verifyOtpLogin`)

Flow
1. Admin login (`POST /api/auth/login`):
   - If user role is `admin`, backend generates a 6-digit OTP.
   - OTP is saved to `users` table columns (`otp_code`, `otp_expires_at`, etc.).
   - For demo: OTP is returned in response.
2. OTP verification (`POST /api/auth/login/verify-otp`):
   - Validates OTP format (6 digits) and identifier.
   - Checks OTP exists and is not expired.
   - If OTP mismatch: increments `otp_attempts`.
   - If correct: clears OTP fields and issues JWT.

Errors
- `OTP expired or not requested`
- `OTP expired`
- `Invalid OTP`

## Social Login (Demo)
Implemented in `backend/src/controllers/authController.js` (`socialAuth`):
- Backend does not verify Google token server-side in this implementation.
- It expects frontend to send:
  - `email`, `name`, `sub` (Google id)
- If a user exists by Google id -> issue JWT.
- If user exists by email but not Google id -> link it.
- Else -> create a new customer user.


