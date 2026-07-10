#!/usr/bin/env sh
set -e
# Run admin+OTP seed inside the backend container using node.
# Env vars should be provided to docker exec.

: "${ADMIN_EMAIL:?ADMIN_EMAIL is required}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}"
: "${ADMIN_CELL_PHONE:?ADMIN_CELL_PHONE is required}"

docker exec -e ADMIN_EMAIL="$ADMIN_EMAIL" -e ADMIN_PASSWORD="$ADMIN_PASSWORD" -e ADMIN_CELLPHONE="$ADMIN_CELL_PHONE" -it glowexpert-backend node seed_admin_otp.js

