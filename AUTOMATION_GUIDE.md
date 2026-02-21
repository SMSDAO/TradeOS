# Master Automation & CI/CD Architecture

## Overview

This document describes the master automation architecture that orchestrates UI, Database, API, and SDK builds and deployments across the GXQ Studio platform.

## Master Orchestration Script

### Purpose

The `master.sh` script provides a comprehensive, production-ready orchestration of the entire system build and validation pipeline. It ensures all components are validated, built, and ready for deployment.

### Location

```bash
scripts/master.sh
```

### Usage

```bash
# Run full master orchestration
npm run master

# Or directly
bash scripts/master.sh
```

### Pipeline Steps

The master script executes an 11-step pipeline:

#### 1. Environment Validation
- Validates all required environment variables using `scripts/env-check.sh`
- Verifies environment template sync with `scripts/env-sync-check.sh`
- Ensures no secrets are committed to `.env.example`
- **Exit on failure**: Yes (critical step)

**Required Variables:**
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `WALLET_PRIVATE_KEY` - Base58 wallet private key
- `JWT_SECRET` - JWT signing secret
- `ADMIN_USERNAME` - Admin panel username
- `ADMIN_PASSWORD` - Admin panel password

#### 2. Clean Dependency Installation
- Runs `npm ci` for backend dependencies
- Runs `npm ci` for webapp dependencies
- Uses `--prefer-offline` for faster installation
- **Exit on failure**: Yes

#### 3. TypeScript Type-Checking
- Type-checks backend with `npm run type-check`
- Type-checks webapp with `npm run type-check:webapp`
- Uses strict TypeScript mode
- **Exit on failure**: Yes

#### 4. Code Linting
- Lints backend with ESLint (`npm run lint`)
- Lints webapp with ESLint (`npm run lint:webapp`)
- Reports issues but continues (non-blocking)
- **Exit on failure**: No (warnings logged)

#### 5. Auto-Fix Pass
- Runs `scripts/auto-fix.sh` to fix common issues
- Formats code and applies safe fixes
- **Exit on failure**: No (warnings logged)

#### 6. Backend Build
- Compiles TypeScript to JavaScript
- Output directory: `dist/`
- Verifies critical artifacts exist:
  - `dist/src/index.js` (main entry)
  - `dist/src/server.js` (server entry)
- **Exit on failure**: Yes

#### 7. Webapp Build
- Builds Next.js webapp for production
- Output directory: `webapp/.next/`
- Optimizes for performance
- **Exit on failure**: Yes

#### 8. Database Schema Validation
- Checks for `db/schema.sql`
- Runs migrations if database is configured
- Uses `scripts/db-migrate.sh`
- **Exit on failure**: No (database is optional)

**Database Configuration:**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gxq_studio
DB_USER=postgres
DB_PASSWORD=your_password
```

#### 9. API Health Check Configuration
- Validates `api/health.ts` exists
- Verifies health endpoints in `src/server.ts`
- **Exit on failure**: No (informational)

#### 10. Build Validation
- Runs `scripts/validate-build.sh`
- Verifies all build artifacts exist
- Checks configuration files
- **Exit on failure**: Yes

#### 11. Git Operations
- Stages changes with `git add .`
- Creates commit with timestamp
- Creates git tag (e.g., `v2025.12.28-1430`)
- Pushes to origin with tags
- **Exit on failure**: No (warnings logged)

## Component Scripts

### Environment Validation

#### `scripts/env-check.sh`
Validates required environment variables are present.

```bash
npm run env-check
```

**Validates:**
- Required variables are set
- Optional variables are documented
- Provides guidance on missing variables

#### `scripts/env-sync-check.sh`
Ensures `.env.example` is synchronized with production requirements.

```bash
npm run env-sync
```

**Validates:**
- All required variables are documented in `.env.example`
- No real secrets are present in `.env.example`
- Placeholders are used appropriately

### Database Management

#### `scripts/db-migrate.sh`
Runs database migrations and seed data.

```bash
npm run db-migrate
```

**Features:**
- Tests database connection
- Runs `db/schema.sql`
- Optionally runs `db/seed.sql`
- Gracefully handles missing database configuration

**Requirements:**
- PostgreSQL client tools (`psql`)
- Database environment variables configured

### Build Validation

#### `scripts/validate-build.sh`
Validates all build artifacts are present and correct.

```bash
npm run validate-build
```

**Checks:**
- Backend build artifacts (`dist/`)
- Webapp build artifacts (`webapp/.next/`)
- Configuration files
- Core scripts
- Database schemas

### Health Checks

#### `scripts/health-check.sh`
Comprehensive system health monitoring.

```bash
npm run health
```

**Checks:**
- Backend service availability
- Webapp service availability
- Database connectivity
- Solana RPC endpoint health
- Environment variable configuration
- System resources (memory, disk)

## CI/CD Integration

### GitHub Actions Workflows

#### Main CI Pipeline (`ci.yml`)

Comprehensive pipeline with the following jobs:

1. **install** - Install dependencies (Node 18, 20)
2. **lint** - ESLint validation
3. **typecheck** - TypeScript type checking
4. **unit-tests-backend** - Backend test suite
5. **unit-tests-webapp** - Webapp test suite
6. **coverage-merge** - Merge and upload coverage
7. **security-scan** - npm audit and security checks
8. **build** - Build backend and webapp
9. **health-check** - Validate health checks and environment ✨ NEW
10. **ci-summary** - Generate summary and report

**Key Features:**
- Runs on pull requests and push to main/develop
- Matrix strategy for multiple Node versions
- Artifact caching for faster builds
- Continue-on-error for non-critical steps
- Comprehensive reporting

#### Auto-Merge Workflow (`auto-merge.yml`)

Enables native GitHub auto-merge when conditions are met:

**Requirements:**
- PR has `auto-merge` label
- PR is not in draft state
- At least 1 approval from non-bot user
- No changes requested
- All required CI checks pass (enforced by GitHub)

**How it works:**
1. Validates PR meets gating requirements
2. Enables GitHub native auto-merge
3. GitHub automatically merges when all status checks pass
4. Respects branch protection rules

**Respects Branch Protection:**
The workflow uses GitHub's native auto-merge API, which automatically respects all branch protection rules configured in the repository settings, including:
- Required status checks
- Required reviews
- Required signatures
- Restrictions on who can push

**How to Use:**
1. Create your PR as normal
2. Add the `auto-merge` label to the PR
3. Get at least 1 approval from a team member
4. The workflow will automatically enable GitHub's auto-merge
5. When all CI checks pass, GitHub will automatically merge the PR
6. A comment will be added to confirm auto-merge is enabled

**Troubleshooting:**
- If the workflow fails with "Missing 'auto-merge' label", add the label via GitHub UI
- If it fails with "Not enough approvals", request and receive a review approval
- If it fails with "Changes requested", address the review comments first
- If it fails with "PR is draft", mark the PR as ready for review

### Running CI Locally

```bash
# Full validation suite
npm run validate

# Individual steps (matching CI)
npm run lint
npm run type-check
npm run test
npm run build
npm run health
```

## Environment Template Management

### `.env.example` Structure

The `.env.example` file serves as the canonical documentation for all environment variables.

**Sections:**
1. Deployment Platform
2. Solana Configuration (Required)
3. Server Configuration
4. Admin Panel (Required)
5. Trading Configuration
6. Jito MEV Protection
7. Jupiter V6 Configuration
8. Priority Fee Configuration
9. Dev Fee Configuration
10. Profit Distribution
11. Flash Loan Providers
12. Jupiter Aggregator
13. QuickNode Configuration (Optional)
14. Oracle Intelligence (Optional)
15. Database Configuration (Optional)
16. Farcaster Integration (Optional)
17. GXQ Ecosystem (Optional)
18. Webapp Configuration
19. Application Settings
20. Production System Configuration

**Security Requirements:**
- All values must be placeholders
- No real secrets committed
- Clear documentation for each variable
- Examples of expected format

### Syncing Production Variables

When adding new environment variables:

1. Add to your local `.env` file
2. Add to `.env.example` with placeholder value
3. Document the variable's purpose
4. Run `npm run env-sync` to validate
5. Update this documentation if needed

## Database Architecture

### Schema Management

Location: `db/schema.sql`

**Features:**
- PostgreSQL 12+ compatible
- UUID primary keys
- Comprehensive wallet analysis tables
- Farcaster profile integration
- Trade history tracking
- Airdrop eligibility scoring

### Migration Process

**Automatic (via master.sh):**
```bash
npm run master  # Runs migrations if DB configured
```

**Manual:**
```bash
npm run db-migrate
```

**Production Deployment:**
```bash
# Set environment variables
export DB_HOST=your-db-host
export DB_USER=your-db-user
export DB_PASSWORD=your-db-password
export DB_NAME=gxq_studio

# Run migrations
npm run db-migrate
```

## API & SDK Considerations

### API Endpoints

The system provides a unified API through `src/server.ts`:

**Health Endpoints:**
- `GET /health` - System health status
- `GET /api/health` - API health check

**Admin Endpoints:**
- `POST /api/admin/start` - Start arbitrage scanning
- `POST /api/admin/stop` - Stop scanning
- `POST /api/admin/pause` - Pause scanning
- `GET /api/admin/status` - Get current status

**Monitoring:**
- `GET /api/monitor` - Real-time metrics
- `GET /metrics` - Prometheus metrics

### SDK & TypeScript Declarations

The project is not published as an SDK, but provides:

- Type declarations in `src/types.ts`
- Service interfaces for flash loans, DEX, providers
- Reusable utilities in `src/utils/`

**For SDK publishing (future):**
1. Add `types` field to `package.json`
2. Configure `tsconfig.json` with `declaration: true`
3. Add `prepublishOnly` script
4. Configure npm registry

## Deployment Targets

### Supported Platforms

1. **Vercel** (Webapp)
   - Root Directory: `webapp`
   - Build Command: `npm run build`
   - Output: `.next/`
   
2. **Railway** (Backend)
   - Build Command: `npm run build:backend`
   - Start Command: `npm run start:server`
   - Port: 3000

3. **Docker**
   - Multi-stage builds
   - Separate containers for backend/webapp
   - Docker Compose orchestration

4. **VPS/Self-Hosted**
   - PM2 process management
   - Systemd service configuration
   - Nginx reverse proxy

### Pre-Deployment Checklist

Before deploying to any platform:

1. ✅ Run `npm run master` successfully
2. ✅ Ensure all CI checks pass
3. ✅ Verify environment variables are configured
4. ✅ Test health endpoints locally
5. ✅ Review security audit logs
6. ✅ Backup database (if applicable)
7. ✅ Tag release with semantic version

## Troubleshooting

### Common Issues

**Issue: Environment validation fails**
```bash
# Solution: Check required variables
npm run env-check

# Copy example and fill in values
cp .env.example .env
nano .env
```

**Issue: Build artifacts missing**
```bash
# Solution: Clean and rebuild
rm -rf dist webapp/.next
npm run build
```

**Issue: Database migration fails**
```bash
# Solution: Check database connectivity
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Verify credentials
npm run env-check
```

**Issue: Health check fails in CI**
```bash
# Solution: Run health check locally
npm run health

# Check for missing dependencies
npm ci
cd webapp && npm ci && cd ..
```

### Debug Mode

Enable verbose logging:

```bash
# Set debug mode
export DEBUG=true
export LOG_LEVEL=debug

# Run master script
npm run master
```

## Best Practices

### Before Committing

1. Run `npm run master` to validate everything
2. Check `git status` to review changes
3. Ensure no secrets in committed files
4. Run `npm run env-sync` to validate templates

### Branch Protection

Recommended settings:
- Require pull request reviews (1+)
- Require status checks to pass:
  - lint
  - typecheck
  - unit-tests-backend
  - build
  - health-check
- Require branches to be up to date
- Include administrators in restrictions

### Auto-Merge Usage

1. Create PR with comprehensive description
2. Add `auto-merge` label
3. Request review from team member
4. Wait for approval
5. Auto-merge enables automatically
6. PR merges when CI passes

## Security Considerations

### Secret Management

- Never commit secrets to version control
- Use environment variables for all sensitive data
- Rotate secrets regularly (JWT_SECRET, passwords)
- Use strong passwords (12+ characters)
- Enable 2FA on all service accounts

### Environment Files

- `.env` - Local development (gitignored)
- `.env.example` - Template (committed)
- `.env.local` - Alternative local (gitignored)
- `.env.production` - Never commit this!

### Audit Trail

- All deployments logged with timestamps
- Git tags for version tracking
- CI/CD logs retained for 7 days
- Database migrations tracked in schema

## Monitoring & Observability

### Health Checks

The system provides multiple health check levels:

1. **Basic**: Service is running
2. **Database**: Database connectivity
3. **RPC**: Solana RPC availability
4. **Full**: All components operational

### Metrics

Prometheus-compatible metrics at `/metrics`:
- Request rates
- Response times
- Error rates
- Trade execution metrics
- Arbitrage opportunities found

### Logging

Structured logging via Winston:
- Development: Console with colors
- Production: JSON to stdout
- Levels: error, warn, info, debug
- Correlation IDs for request tracing

## Contributing

When adding new automation:

1. Update `scripts/master.sh` if needed
2. Add corresponding npm script to `package.json`
3. Document in this file
4. Add to CI workflow if required
5. Update `.env.example` with new variables
6. Test locally before committing

## Version History

- **v1.0.0** - Initial master automation
- **v1.1.0** - Added database migration support
- **v1.2.0** - Added environment sync validation
- **v1.3.0** - Added health check to CI pipeline
- **v1.4.0** - Enhanced auto-merge with branch protection

---

**Last Updated**: 2025-12-28
**Maintained By**: GXQ Studio Team
