#!/usr/bin/env bash
# ==============================================================================
# GARSAME v3 — Zero-Downtime Deployment & Update Script
# Usage: ./deploy/scripts/update.sh
# ==============================================================================

set -euo pipefail

APP_DIR="/var/www/garsame-v3"
LOG_FILE="/var/log/garsame/deploy.log"

mkdir -p "$(dirname "${LOG_FILE}")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*" | tee -a "${LOG_FILE}"
}

cd "${APP_DIR}"

log "Starting deployment update..."

# 1. Fetch latest git commits
log "Pulling latest code from origin main..."
git pull origin main

# 2. Install production dependencies
log "Installing dependencies..."
npm ci

# 3. Build Next.js production bundle
log "Building Next.js application..."
npm run build

# 4. Run database index sync & seed verification
log "Synchronizing database indexes..."
npm run db:seed

# 5. Reload PM2 cluster gracefully
log "Reloading PM2 application..."
pm2 reload ecosystem.config.cjs --env production

# 6. Verify health check endpoint
log "Verifying health check..."
sleep 3
if curl -fsSL http://127.0.0.1:3000/api/health > /dev/null; then
    log "Deployment SUCCESSFUL! Application is healthy."
else
    log "WARNING: Health check failed after reload! Check pm2 logs." >&2
    exit 1
fi
