#!/bin/bash
# ==============================================================================
# Premium RPC Validation for Mainnet Production
# ==============================================================================
# This script enforces premium RPC usage for mainnet production deployments
# to ensure adequate performance and reliability
#
# Usage: bash scripts/validate-rpc-premium.sh
# ==============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables if .env exists (safer parsing)
if [ -f .env ]; then
    set -a
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        if [[ ! $key =~ ^# ]] && [[ -n $key ]]; then
            # Remove quotes from value if present
            value="${value%\"}"
            value="${value#\"}"
            export "$key=$value"
        fi
    done < .env
    set +a
fi

echo "=================================="
echo "Premium RPC Validation"
echo "=================================="
echo ""

# Check if we're in production
if [[ "${NODE_ENV}" == "production" ]] || [[ "${DEPLOYMENT_PLATFORM}" =~ ^(vercel|railway)$ ]]; then
    # We are in production - proceed with strict validation
    :
else
    echo -e "${YELLOW}⚠ Not in production mode. Skipping strict RPC validation.${NC}"
    exit 0
fi

echo "Environment: ${NODE_ENV:-development}"
echo "Platform: ${DEPLOYMENT_PLATFORM:-localhost}"
echo ""

# Free/public RPC endpoints that should not be used in production
FORBIDDEN_RPCS=(
    "api.mainnet-beta.solana.com"
    "api.devnet.solana.com"
    "api.testnet.solana.com"
)

# Premium RPC providers
PREMIUM_PROVIDERS=(
    "helius-rpc.com"
    "quiknode.pro"
    "rpcpool.com"
    "triton"
    "alchemy.com"
    "ankr.com"
    "getblock.io"
)

# Function to check if RPC is premium
is_premium_rpc() {
    local rpc_url=$1
    
    # Check if it matches any premium provider
    for provider in "${PREMIUM_PROVIDERS[@]}"; do
        if [[ "$rpc_url" == *"$provider"* ]]; then
            return 0  # Is premium
        fi
    done
    
    return 1  # Not premium
}

# Function to check if RPC is forbidden
is_forbidden_rpc() {
    local rpc_url=$1
    
    for forbidden in "${FORBIDDEN_RPCS[@]}"; do
        if [[ "$rpc_url" == *"$forbidden"* ]]; then
            return 0  # Is forbidden
        fi
    done
    
    return 1  # Not forbidden
}

ERRORS=0

# Check SOLANA_RPC_URL
echo "Checking RPC Configuration..."
echo ""

if [ -z "$SOLANA_RPC_URL" ]; then
    echo -e "${RED}✗ SOLANA_RPC_URL is not set!${NC}"
    ERRORS=$((ERRORS + 1))
else
    # Extract hostname without exposing API keys in URL
    RPC_HOST=$(echo "$SOLANA_RPC_URL" | sed -E 's|^https?://([^/]+).*|\1|' | sed -E 's/\?.*//')
    echo "SOLANA_RPC_URL: Configured (host: ${RPC_HOST})"
    
    if is_forbidden_rpc "$SOLANA_RPC_URL"; then
        echo -e "${RED}✗ FORBIDDEN: Using free/public RPC endpoint in production!${NC}"
        echo -e "${RED}  Free RPCs are rate-limited and unreliable for production use.${NC}"
        ERRORS=$((ERRORS + 1))
    elif is_premium_rpc "$SOLANA_RPC_URL"; then
        echo -e "${GREEN}✓ Using premium RPC provider${NC}"
    else
        echo -e "${YELLOW}⚠ WARNING: RPC provider not recognized as premium.${NC}"
        echo -e "${YELLOW}  Please verify this is a paid/premium endpoint.${NC}"
    fi
fi
echo ""

# Check for premium RPC alternatives
echo "Checking for Premium RPC Alternatives..."
HAS_PREMIUM_BACKUP=false

if [ -n "$QUICKNODE_RPC_URL" ] && is_premium_rpc "$QUICKNODE_RPC_URL"; then
    echo -e "${GREEN}✓ QuickNode RPC configured${NC}"
    HAS_PREMIUM_BACKUP=true
fi

if [ -n "$NEXT_PUBLIC_HELIUS_RPC" ] && is_premium_rpc "$NEXT_PUBLIC_HELIUS_RPC"; then
    echo -e "${GREEN}✓ Helius RPC configured${NC}"
    HAS_PREMIUM_BACKUP=true
fi

if [ -n "$NEXT_PUBLIC_TRITON_RPC" ] && is_premium_rpc "$NEXT_PUBLIC_TRITON_RPC"; then
    echo -e "${GREEN}✓ Triton RPC configured${NC}"
    HAS_PREMIUM_BACKUP=true
fi

if [ "$HAS_PREMIUM_BACKUP" = false ]; then
    echo -e "${YELLOW}⚠ No premium RPC backup providers configured${NC}"
fi
echo ""

# Check RPC rotation configuration
echo "Checking RPC Rotation Configuration..."
if [ "$RPC_ROTATION_ENABLED" = "true" ]; then
    if [ -n "$RPC_ENDPOINTS" ]; then
        echo -e "${GREEN}✓ RPC rotation enabled with endpoints${NC}"
    else
        echo -e "${YELLOW}⚠ RPC rotation enabled but no endpoints configured${NC}"
    fi
else
    echo -e "${YELLOW}⚠ RPC rotation not enabled (single point of failure)${NC}"
fi
echo ""

# Summary
echo "=================================="
echo "Validation Summary"
echo "=================================="

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ VALIDATION FAILED!${NC}"
    echo ""
    echo "Production deployment requires premium RPC endpoints."
    echo ""
    echo "Recommended Premium RPC Providers:"
    echo "  • Helius: https://www.helius.dev/"
    echo "  • QuickNode: https://www.quicknode.com/"
    echo "  • Triton: https://www.triton.one/"
    echo "  • Alchemy: https://www.alchemy.com/"
    echo ""
    echo "Update your .env file or environment variables with a premium RPC URL."
    exit 1
else
    echo -e "${GREEN}✅ RPC configuration validated for production!${NC}"
    exit 0
fi
