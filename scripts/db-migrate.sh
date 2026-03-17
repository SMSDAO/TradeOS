#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# GXQ Smart Brain: Database Migration Script
# ==============================================================================
# Runs database migrations and seed data
# Exit 0 if successful, exit 1 on failure
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
echo "🗄️  GXQ Smart Brain: Database Migration"
echo "======================================================================"
echo ""

# Load environment variables if available
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Check if database is configured
if [ -z "${DB_HOST:-}" ]; then
  log_warning "DB_HOST not set - skipping database migration"
  log_info "Database is optional for this application"
  exit 0
fi

if [ -z "${DB_USER:-}" ]; then
  log_error "DB_USER is required when DB_HOST is set"
  exit 1
fi

if [ -z "${DB_NAME:-}" ]; then
  DB_NAME="gxq_studio"
  log_info "Using default database name: $DB_NAME"
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
  log_error "psql command not found. Please install PostgreSQL client tools."
  exit 1
fi

log_info "Database configuration:"
log_info "  Host: $DB_HOST"
log_info "  User: $DB_USER"
log_info "  Database: $DB_NAME"
echo ""

# Test database connection
log_info "Testing database connection..."
if PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" &> /dev/null; then
  log_success "Database connection successful"
else
  log_error "Cannot connect to database"
  log_info "Please check your database credentials and ensure the database server is running"
  exit 1
fi

# Run schema migration
if [ -f "db/schema.sql" ]; then
  log_info "Running schema migration..."
  if PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "db/schema.sql" 2>&1 | tail -20; then
    log_success "Schema migration completed"
  else
    log_error "Schema migration failed"
    exit 1
  fi
else
  log_warning "No schema.sql file found in db/"
  exit 1
fi

# Check for seed data
if [ -f "db/seed.sql" ]; then
  log_info "Running seed data..."
  if PGPASSWORD="${DB_PASSWORD:-}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "db/seed.sql" 2>&1 | tail -20; then
    log_success "Seed data loaded"
  else
    log_warning "Seed data failed (may already exist)"
  fi
else
  log_info "No seed.sql file found (optional)"
fi

echo ""
echo "======================================================================"
echo "✅ Database migration completed successfully"
echo "======================================================================"
echo ""

exit 0
