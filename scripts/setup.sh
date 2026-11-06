#!/bin/bash
# Auto-setup script for JobWay — runs before dev server starts
# Ensures .env exists, DB folder exists, Prisma client generated, DB schema pushed
set -e

cd "$(dirname "$0")/.."

# 1. Create .env from .env.example if missing
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "[setup] created .env from .env.example"
  else
    printf 'DATABASE_URL="file:./db/dev.db"\nSESSION_SECRET="jobway-dev-secret-change-in-production-please-use-a-long-random-string"\n' > .env
    echo "[setup] created .env with defaults"
  fi
else
  echo "[setup] .env already exists"
fi

# 2. Ensure db/ folder exists (SQLite needs the directory)
mkdir -p db
echo "[setup] db/ folder ready"

# 3. Generate Prisma Client (only if not already generated)
if [ ! -d node_modules/.prisma/client ]; then
  echo "[setup] generating Prisma Client..."
  bunx prisma generate > /dev/null 2>&1 2>/dev/null || npx prisma generate > /dev/null 2>&1
  echo "[setup] Prisma Client generated"
else
  echo "[setup] Prisma Client already present"
fi

# 4. Push schema to database (creates tables if missing)
echo "[setup] syncing database schema..."
bunx prisma db push > /dev/null 2>&1 || npx prisma db push > /dev/null 2>&1
echo "[setup] database schema synced"

echo "[setup] ready"
