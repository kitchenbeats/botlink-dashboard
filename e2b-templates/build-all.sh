#!/bin/bash

# Build script for all E2B templates with start commands and readiness checks

set -e

export E2B_DOMAIN=ledgai.com
export E2B_ACCESS_TOKEN=sk_e2b_cff0821a40457e87fc89dbf394c3fcd727be341e
export E2B_API_KEY=e2b_5528ce6c926983af2b5fe13a73444d1b7ba53efb

echo "🚀 Building all ReactWrite templates..."

# Simple HTML template
echo ""
echo "📦 Building reactwrite-simple-html..."
cd /Users/jeremyhanlon/Documents/2025_Projects/botlink-dashboard/e2b-templates/simple-html
e2b template build-v2 reactwrite-simple-html \
  --dockerfile e2b.Dockerfile \
  --cpu-count 2 \
  --memory-mb 2048 \
  --no-cache \
  -c "cd /templates/simple-html && npx http-server . -p 3000 -c-1" \
  --ready-cmd "timeout 30 bash -c 'until curl -s http://localhost:3000 > /dev/null; do sleep 1; done'"

echo "✅ reactwrite-simple-html built"

# Next.js Basic template
echo ""
echo "📦 Building reactwrite-nextjs-basic..."
cd /Users/jeremyhanlon/Documents/2025_Projects/botlink-dashboard/e2b-templates/nextjs-basic
e2b template build-v2 reactwrite-nextjs-basic \
  --dockerfile e2b.Dockerfile \
  --cpu-count 2 \
  --memory-mb 2048 \
  --no-cache \
  -c "cd /templates/nextjs-basic && npm run dev -- --hostname 0.0.0.0 --port 3000" \
  --ready-cmd "timeout 60 bash -c 'until curl -s http://localhost:3000 > /dev/null; do sleep 1; done'"

echo "✅ reactwrite-nextjs-basic built"

# Next.js SaaS Starter template
echo ""
echo "📦 Building reactwrite-nextjs-saas..."
cd /Users/jeremyhanlon/Documents/2025_Projects/botlink-dashboard/e2b-templates/nextjs-saas-starter
e2b template build-v2 reactwrite-nextjs-saas \
  --dockerfile e2b.Dockerfile \
  --cpu-count 2 \
  --memory-mb 2048 \
  --no-cache \
  -c "(/usr/local/bin/init-saas-db.sh &) && cd /templates/nextjs-saas && pnpm dev --hostname 0.0.0.0 --port 3000" \
  --ready-cmd "timeout 60 bash -c 'until curl -s http://localhost:3000 > /dev/null; do sleep 1; done'"

echo "✅ reactwrite-nextjs-saas built"

echo ""
echo "🎉 All templates built successfully!"

echo ""
echo "📤 Publishing all templates..."

# Publish all templates
e2b template publish reactwrite-simple-html --yes
e2b template publish reactwrite-nextjs-basic --yes
e2b template publish reactwrite-nextjs-saas --yes

echo ""
echo "✅ All templates published!"
