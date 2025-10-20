#!/bin/bash
if [ ! -f /tmp/saas-db-initialized ]; then
  sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true
  sudo -u postgres createdb saas 2>/dev/null || true
  cd /templates/nextjs-saas && pnpm db:migrate 2>/dev/null || true
  touch /tmp/saas-db-initialized
fi
