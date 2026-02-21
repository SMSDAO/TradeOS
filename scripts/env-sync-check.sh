#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# GXQ Smart Brain: Environment Sync Validator
# ==============================================================================
# Validates that production environment variables are documented in .env.example
# Exit 0 if sync is good, exit 1 if missing vars
# ==============================================================================

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_info() {
  echo -e "${CYAN}ℹ️  $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "======================================================================"
echo "🔄 GXQ Smart Brain: Environment Sync Validation"
echo "======================================================================"
echo ""

# Required environment variables that must be documented
REQUIRED_VARS=(
  "SOLANA_RPC_URL"
  "WALLET_PRIVATE_KEY"
  "JWT_SECRET"
  "ADMIN_USERNAME"
  "ADMIN_PASSWORD"
  "NEXT_PUBLIC_RPC_URL"
  "NEXT_PUBLIC_BACKEND_URL"
  "NEXT_PUBLIC_WS_URL"
  "PORT"
  "HOST"
)

# Optional but recommended variables
OPTIONAL_VARS=(
  "DB_HOST"
  "DB_PORT"
  "DB_NAME"
  "DB_USER"
  "DB_PASSWORD"
  "GEMINI_API_KEY"
  "NEYNAR_API_KEY"
  "QUICKNODE_RPC_URL"
  "VERCEL_TOKEN"
  "GITHUB_TOKEN"
)

MISSING_COUNT=0
DOCUMENTED_COUNT=0

# Check .env.example exists
if [ ! -f ".env.example" ]; then
  log_error ".env.example file not found"
  exit 1
fi

log_info "Checking required variables are documented in .env.example..."
echo ""

# Check required variables
echo "Required Variables:"
echo "======================================================================"
for var in "${REQUIRED_VARS[@]}"; do
  if grep -q "^${var}=" .env.example || grep -q "^# ${var}=" .env.example; then
    log_success "$var is documented"
    ((DOCUMENTED_COUNT++)) || true
  else
    log_error "$var is NOT documented in .env.example"
    ((MISSING_COUNT++)) || true
  fi
done

echo ""
echo "Optional Variables:"
echo "======================================================================"
for var in "${OPTIONAL_VARS[@]}"; do
  if grep -q "^${var}=" .env.example || grep -q "^# ${var}=" .env.example; then
    log_success "$var is documented"
  else
    log_warning "$var is not documented (optional)"
  fi
done

echo ""

# Security check: ensure no actual secrets in .env.example
echo "Security Audit:"
echo "======================================================================"

SECRETS_FOUND=0

# Patterns that should NOT appear in .env.example
SECRET_PATTERNS=(
  "sk-[a-zA-Z0-9]{32,}"  # API keys starting with sk-
  "[0-9a-fA-F]{64}"      # 64-char hex strings (likely private keys)
  "ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"  # JWT tokens
)

for pattern in "${SECRET_PATTERNS[@]}"; do
  if grep -qE "$pattern" .env.example; then
    log_error "Potential secret found matching pattern: $pattern"
    ((SECRETS_FOUND++)) || true
  fi
done

# Check for common placeholder violations
if grep -qE "^[A-Z_]+=\S{32,}" .env.example | grep -qvE "(example|placeholder|your_|change_me|localhost|api\.mainnet)"; then
  log_warning "Found potentially real values in .env.example"
  log_info "Ensure all values are placeholders only"
fi

if [ $SECRETS_FOUND -eq 0 ]; then
  log_success "No obvious secrets found in .env.example"
else
  log_error "Found $SECRETS_FOUND potential secrets in .env.example"
  log_error "Remove all real secrets from .env.example immediately!"
fi

echo ""
echo "======================================================================"
echo "Summary:"
echo "======================================================================"
echo "✅ Documented required vars: $DOCUMENTED_COUNT / ${#REQUIRED_VARS[@]}"
echo "❌ Missing required vars: $MISSING_COUNT"
echo "🔒 Security issues: $SECRETS_FOUND"
echo ""

if [ $MISSING_COUNT -gt 0 ]; then
  log_error "Environment sync validation FAILED"
  log_info "Add missing variables to .env.example with placeholder values"
  exit 1
elif [ $SECRETS_FOUND -gt 0 ]; then
  log_error "Security validation FAILED"
  log_info "Remove all real secrets from .env.example"
  exit 1
else
  log_success "Environment sync validation PASSED"
  exit 0
fi
