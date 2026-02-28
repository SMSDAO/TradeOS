#!/bin/bash
# ==============================================================================
# Vercel Environment Validation Script
# ==============================================================================
# This script validates that required environment variables are set for
# Vercel deployment
#
# Usage: bash scripts/validate-vercel-env.sh
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "=================================="
echo "Vercel Environment Validation"
echo "=================================="
echo ""

# Function to check required variable
check_required() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}✗ MISSING:${NC} $var_name"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ SET:${NC} $var_name"
    fi
}

# Function to check optional variable
check_optional() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}⚠ OPTIONAL:${NC} $var_name (not set)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓ SET:${NC} $var_name"
    fi
}

echo "Core Configuration:"
check_required "NEXT_PUBLIC_RPC_URL"
check_required "NEXT_PUBLIC_BACKEND_URL"
check_required "NEXT_PUBLIC_WS_URL"
echo ""

echo "Admin Panel:"
check_required "ADMIN_USERNAME"
check_required "ADMIN_PASSWORD"
check_required "JWT_SECRET"
echo ""

echo "Solana Configuration:"
check_optional "SOLANA_RPC_URL"
check_optional "SOLANA_WS_URL"
check_optional "WALLET_PRIVATE_KEY"
echo ""

echo "Premium RPC Providers (Optional):"
check_optional "NEXT_PUBLIC_HELIUS_RPC"
check_optional "NEXT_PUBLIC_QUICKNODE_RPC"
check_optional "NEXT_PUBLIC_TRITON_RPC"
echo ""

echo "Billing (Optional):"
check_optional "BILLING_ENABLED"
check_optional "STRIPE_PUBLIC_KEY"
check_optional "STRIPE_SECRET_KEY"
echo ""

echo "Bot Configuration (Optional):"
check_optional "SNIPER_BOT_ENABLED"
check_optional "AUTO_TRADE_ENABLED"
echo ""

echo "Price Feeds (Optional):"
check_optional "PYTH_PRICE_FEED_ENABLED"
check_optional "JUPITER_PRICE_API_ENABLED"
echo ""

echo "Admin App Sync (Optional):"
check_optional "ADMIN_APP_SYNC_ENABLED"
check_optional "ADMIN_APP_API_KEY"
echo ""

echo "=================================="
echo "Validation Summary"
echo "=================================="
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Validation FAILED!${NC}"
    echo "Please set all required environment variables before deploying to Vercel."
    exit 1
else
    echo -e "${GREEN}✅ Validation PASSED!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Note: $WARNINGS optional variables are not set.${NC}"
    fi
    exit 0
fi
