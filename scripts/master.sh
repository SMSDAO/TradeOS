#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# GXQ Smart Brain: Master Orchestrator
# ==============================================================================
# Central orchestrator that enforces stability and deployment readiness
# Validates, builds, commits, tags, and pushes to ensure production-ready state
# Exit 0: Success, system is production-ready
# Exit 1: Failure at any validation/build step
# ==============================================================================

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Helper functions
log_step() {
  echo ""
  echo "======================================================================"
  echo -e "${BLUE}▶ $1${NC}"
  echo "======================================================================"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_info() {
  echo -e "${CYAN}ℹ️  $1${NC}"
}

abort() {
  echo ""
  echo "======================================================================"
  echo -e "${RED}❌ MASTER ORCHESTRATION FAILED${NC}"
  echo "======================================================================"
  echo -e "${RED}Error: $1${NC}"
  echo ""
  echo "💡 Next steps:"
  echo "   - Review error messages above"
  echo "   - Fix the issue and run again: bash scripts/master.sh"
  echo "   - For environment issues: bash scripts/env-check.sh"
  echo "   - For build issues: npm run build"
  echo ""
  exit 1
}

# Script start
echo ""
echo "======================================================================"
echo "🧠 GXQ SMART BRAIN OPERATOR - MASTER ORCHESTRATION"
echo "======================================================================"
echo "Production-ready deployment orchestration system"
echo "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo "======================================================================"

# Generate timestamp for commit and tag
TIMESTAMP=$(date '+%Y.%m.%d-%H%M')
COMMIT_MESSAGE="[master] auto: stabilization and build — $TIMESTAMP"
TAG_NAME="v$TIMESTAMP"

# Step 1: Environment validation
log_step "Step 1/11: Environment Validation"
if bash scripts/env-check.sh; then
  log_success "Environment validation passed"
else
  abort "Environment validation failed. Required variables missing."
fi

# Verify environment sync with .env.example
log_info "Checking environment template sync..."
if bash scripts/env-sync-check.sh; then
  log_success "Environment template sync validated"
else
  log_error "Environment template sync has issues (non-fatal)"
fi

# Step 2: Clean dependency installation
log_step "Step 2/11: Clean Dependency Installation"

log_info "Installing backend dependencies..."
if npm ci --prefer-offline 2>&1 | tail -20; then
  log_success "Backend dependencies installed"
else
  abort "Backend dependency installation failed"
fi

log_info "Installing webapp dependencies..."
if cd webapp && npm ci --prefer-offline 2>&1 | tail -20 && cd ..; then
  log_success "Webapp dependencies installed"
else
  abort "Webapp dependency installation failed"
fi

# Step 3: TypeScript type-checking
log_step "Step 3/11: TypeScript Type-Checking"

log_info "Type-checking backend..."
if npm run type-check; then
  log_success "Backend type-check passed"
else
  abort "Backend type-check failed. Fix TypeScript errors."
fi

log_info "Type-checking webapp..."
if npm run type-check:webapp; then
  log_success "Webapp type-check passed"
else
  abort "Webapp type-check failed. Fix TypeScript errors."
fi

# Step 4: Linting
log_step "Step 4/11: Code Linting"

log_info "Linting backend..."
if npm run lint 2>&1 | tee /tmp/backend-lint.log; then
  log_success "Backend linting passed"
else
  log_error "Backend linting has issues (continuing...)"
  # Note: Current CI has continue-on-error for linting, so we'll match that behavior
  # In production, you may want to make this fail-fast
fi

log_info "Linting webapp..."
if npm run lint:webapp 2>&1 | tee /tmp/webapp-lint.log; then
  log_success "Webapp linting passed"
else
  log_error "Webapp linting has issues (continuing...)"
  # Note: Current CI has continue-on-error for linting
fi

# Step 5: Auto-fix pass
log_step "Step 5/11: Auto-Fix Pass"
if bash scripts/auto-fix.sh; then
  log_success "Auto-fix completed"
else
  log_error "Auto-fix completed with warnings (non-fatal)"
fi

# Step 6: Backend build
log_step "Step 6/11: Backend Build"
log_info "Building backend..."
if npm run build:backend 2>&1 | tail -30; then
  log_success "Backend build completed"
else
  abort "Backend build failed"
fi

# Verify backend build output
if [ -f "dist/src/index.js" ] && [ -f "dist/src/server.js" ]; then
  log_success "Backend build artifacts verified"
else
  abort "Backend build artifacts missing"
fi

# Step 7: Webapp build
log_step "Step 7/11: Webapp Build"
log_info "Building webapp..."
if npm run build:webapp 2>&1 | tail -30; then
  log_success "Webapp build completed"
else
  abort "Webapp build failed"
fi

# Verify webapp build output
if [ -d "webapp/.next" ]; then
  log_success "Webapp build artifacts verified"
else
  abort "Webapp build artifacts missing"
fi

# Step 8: Database Schema Validation
log_step "Step 8/11: Database Schema Validation"
if [ -f "db/schema.sql" ]; then
  log_info "Validating database schema..."
  # Check if DB_HOST is set for migration
  if [ -n "${DB_HOST:-}" ] && [ -n "${DB_USER:-}" ]; then
    log_info "Running database migrations..."
    if bash scripts/db-migrate.sh; then
      log_success "Database migrations completed"
    else
      log_error "Database migrations failed (may be optional)"
    fi
  else
    log_info "Database not configured (optional) - schema file verified"
    log_success "Database schema file present"
  fi
else
  log_info "No database schema found (optional)"
fi

# Step 9: API Health Check Configuration
log_step "Step 9/11: API Health Check Configuration"
if [ -f "api/health.ts" ]; then
  log_info "API health endpoint verified"
  log_success "API health checks configured"
else
  log_info "API health endpoint not found (may use server.ts health endpoint)"
fi

# Verify server has health endpoint
if grep -q "'/health'" src/server.ts 2>/dev/null; then
  log_success "Server health endpoint verified in src/server.ts"
else
  log_info "Health endpoint not explicitly found (non-critical)"
fi

# Step 10: Build validation
log_step "Step 10/11: Build Validation"
if bash scripts/validate-build.sh; then
  log_success "Build validation passed"
else
  abort "Build validation failed"
fi

# Step 11: Git operations (commit, tag, push)
log_step "Step 11/11: Git Operations"

# Check if there are changes to commit
if git diff --quiet && git diff --cached --quiet; then
  log_info "No changes to commit"
else
  log_info "Staging changes..."
  git add .
  
  log_info "Creating commit: $COMMIT_MESSAGE"
  git commit -m "$COMMIT_MESSAGE" || log_info "Commit may have already been created"
  
  log_success "Changes committed"
fi

# Create lightweight tag
log_info "Creating tag: $TAG_NAME"
if git tag "$TAG_NAME" 2>/dev/null; then
  log_success "Tag created: $TAG_NAME"
else
  log_info "Tag may already exist or cannot be created"
fi

# Push to origin
log_info "Pushing to origin master + tags..."
if git push origin HEAD --tags 2>&1 | tail -10; then
  log_success "Pushed to origin with tags"
else
  log_error "Push may have failed (check network/permissions)"
fi

# Final summary
echo ""
echo "======================================================================"
echo "🎉 MASTER ORCHESTRATION COMPLETED SUCCESSFULLY"
echo "======================================================================"
echo ""
echo "📊 Summary:"
echo "  • Commit: $COMMIT_MESSAGE"
echo "  • Tag: $TAG_NAME"
echo "  • Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "🚀 Deployment URLs:"
echo "  • Vercel (Webapp): https://your-app.vercel.app"
echo "  • Railway (Backend): https://your-app.railway.app"
echo "  • GitHub: https://github.com/SMSDAO/reimagined-jupiter"
echo ""
echo "✅ System is production-ready!"
echo "======================================================================"
echo ""

exit 0
