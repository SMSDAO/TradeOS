#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# GXQ STUDIO - Setup Script
# Automate environment bootstrapping, dependency installation, static checks,
# builds, and optional Vercel env hydration for NEXT_PUBLIC_RPC_URL
# ==============================================================================

PROJECT="reimagined-jupiter"
NODE_REQUIRED="20"
WEBAPP_DIR="webapp"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# Helper Functions
# ==============================================================================

log() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

err() {
  echo -e "${RED}[ERROR]${NC} $1"
}

ok() {
  echo -e "${GREEN}[OK]${NC} $1"
}

# ==============================================================================
# Step Functions
# ==============================================================================

init_env() {
  log "Initializing environment configuration..."
  
  if [ -f .env ]; then
    ok "Environment file .env already exists"
  elif [ -f .env.example ]; then
    log "Copying .env.example to .env"
    cp .env.example .env
    ok "Created .env from .env.example"
  else
    err "No .env.example file found - cannot initialize environment"
    exit 1
  fi
  
  ok "Environment initialization completed"
}

check_node() {
  log "Checking Node.js installation..."
  
  if ! command -v node &> /dev/null; then
    err "Node.js is not installed"
    exit 1
  fi
  
  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  log "Found Node.js version: $(node -v)"
  
  if [ "$NODE_VERSION" != "$NODE_REQUIRED" ]; then
    warn "Node.js version mismatch: found v$NODE_VERSION, recommended v$NODE_REQUIRED"
  fi
  
  ok "Node.js check completed"
}

install_deps() {
  log "Installing dependencies..."
  
  # Install root dependencies
  log "Installing root dependencies..."
  if ! npm ci 2>/dev/null; then
    warn "npm ci failed, trying npm install as fallback"
    if ! npm install; then
      warn "npm install failed, cleaning cache and retrying npm ci"
      npm cache clean --force
      if ! npm ci; then
        err "Failed to install root dependencies after retry"
        exit 1
      fi
    fi
  fi
  ok "Root dependencies installed"
  
  # Install webapp dependencies if webapp directory exists
  if [ -d "$WEBAPP_DIR" ]; then
    log "Installing webapp dependencies..."
    cd "$WEBAPP_DIR"
    
    if ! npm ci 2>/dev/null; then
      warn "npm ci failed in webapp, trying npm install as fallback"
      if ! npm install; then
        warn "npm install failed in webapp, cleaning cache and retrying npm ci"
        npm cache clean --force
        if ! npm ci; then
          err "Failed to install webapp dependencies after retry"
          exit 1
        fi
      fi
    fi
    ok "Webapp dependencies installed"
    cd ..
  fi
  
  ok "Dependency installation completed"
}

static_checks() {
  log "Running static checks..."
  
  # TypeScript type checking
  if [ -f tsconfig.json ]; then
    log "Running TypeScript type check..."
    if ! npx tsc --noEmit; then
      err "TypeScript type check failed"
      exit 1
    fi
    ok "TypeScript type check passed"
  fi
  
  # Run linting if lint script exists
  if npm run | grep -q "^\s*lint$"; then
    log "Running linter..."
    if ! npm run lint; then
      err "Linting failed"
      exit 1
    fi
    ok "Linting passed"
  fi
  
  ok "Static checks completed"
}

build_all() {
  log "Building project..."
  
  # Build root if build script exists
  if npm run | grep -q "^\s*build$"; then
    log "Building root project..."
    if ! npm run build; then
      err "Root build failed"
      exit 1
    fi
    ok "Root build completed"
  fi
  
  # Build webapp if it exists and has build script
  if [ -d "$WEBAPP_DIR" ]; then
    cd "$WEBAPP_DIR"
    if npm run | grep -q "^\s*build$"; then
      log "Building webapp..."
      if ! npm run build; then
        cd ..
        err "Webapp build failed"
        exit 1
      fi
      ok "Webapp build completed"
    fi
    cd ..
  fi
  
  ok "Build process completed"
}

sync_vercel_env() {
  log "Syncing environment variables to Vercel..."
  
  # Check if NEXT_PUBLIC_RPC_URL exists in .env
  if [ ! -f .env ]; then
    warn ".env file not found, skipping Vercel sync"
    ok "Vercel sync skipped (no .env)"
    return
  fi
  
  # Extract NEXT_PUBLIC_RPC_URL from .env
  NEXT_PUBLIC_RPC_URL=$(grep -E "^NEXT_PUBLIC_RPC_URL=" .env | cut -d= -f2- | sed 's/^["'\'']\(.*\)["'\'']$/\1/' || echo "")
  
  if [ -z "$NEXT_PUBLIC_RPC_URL" ]; then
    warn "NEXT_PUBLIC_RPC_URL not found in .env, skipping Vercel sync"
    ok "Vercel sync skipped (no RPC URL)"
    return
  fi
  
  # Check if vercel CLI is installed
  if ! command -v vercel &> /dev/null; then
    warn "Vercel CLI not installed, skipping Vercel sync"
    ok "Vercel sync skipped (no CLI)"
    return
  fi
  
  # Check for required Vercel environment variables
  if [ -z "${VERCEL_PROJECT_ID:-}" ]; then
    warn "VERCEL_PROJECT_ID not set, skipping Vercel sync"
    ok "Vercel sync skipped (no project ID)"
    return
  fi
  
  if [ -z "${VERCEL_TOKEN:-}" ]; then
    warn "VERCEL_TOKEN not set, skipping Vercel sync"
    ok "Vercel sync skipped (no token)"
    return
  fi
  
  # Set environment variable in Vercel
  log "Setting NEXT_PUBLIC_RPC_URL in Vercel..."
  if ! vercel env add NEXT_PUBLIC_RPC_URL production "$NEXT_PUBLIC_RPC_URL" --token "$VERCEL_TOKEN" 2>/dev/null; then
    warn "Failed to set NEXT_PUBLIC_RPC_URL in Vercel"
  else
    ok "NEXT_PUBLIC_RPC_URL synced to Vercel"
  fi
  
  ok "Vercel sync completed"
}

help() {
  cat << EOF
${GREEN}GXQ STUDIO - Setup Script${NC}

${BLUE}Usage:${NC}
  ./scripts/setup.sh        Run all setup steps
  ./scripts/setup.sh help   Show this help message

${BLUE}Steps performed:${NC}
  1. ${YELLOW}init_env${NC}        Ensure .env exists (copy from .env.example if needed)
  2. ${YELLOW}check_node${NC}      Verify Node.js installation and version
  3. ${YELLOW}install_deps${NC}    Install dependencies with npm ci (fallback to npm install)
  4. ${YELLOW}static_checks${NC}   Run TypeScript type checking and linting
  5. ${YELLOW}build_all${NC}       Build backend and webapp
  6. ${YELLOW}sync_vercel_env${NC} Sync NEXT_PUBLIC_RPC_URL to Vercel (optional)

${BLUE}Requirements:${NC}
  - Node.js ${NODE_REQUIRED}.x (other versions may work with warnings)
  - .env.example file in project root
  - npm installed

${BLUE}Optional:${NC}
  - Vercel CLI and VERCEL_PROJECT_ID, VERCEL_TOKEN for Vercel sync

EOF
}

# ==============================================================================
# Main Execution
# ==============================================================================

main() {
  if [ "${1:-}" = "help" ]; then
    help
    exit 0
  fi
  
  log "Starting setup for ${PROJECT}..."
  echo ""
  
  init_env
  echo ""
  
  check_node
  echo ""
  
  install_deps
  echo ""
  
  static_checks
  echo ""
  
  build_all
  echo ""
  
  sync_vercel_env
  echo ""
  
  ok "Setup completed successfully!"
}

# Run main function with all arguments
main "$@"
