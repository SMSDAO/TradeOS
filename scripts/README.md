# Scripts Directory

This directory contains automation scripts for the GXQ Studio DeFi Platform.

## Available Scripts

### Quick Reference

**Complete Pipeline:**
```bash
npm run master              # Full orchestration (recommended)
```

**Environment & Validation:**
```bash
npm run env-check           # Check environment variables
npm run env-sync            # Validate .env.example sync
npm run validate-build      # Validate build artifacts
npm run health              # System health check
npm run perf                # Performance report
```

**Database:**
```bash
npm run db-migrate          # Run database migrations
```

**Build & Deploy:**
```bash
npm run build               # Build both backend and webapp
npm run build:backend       # Build backend only
npm run build:webapp        # Build webapp only
npm run deploy:vercel       # Deploy webapp to Vercel
npm run deploy:railway      # Deploy backend to Railway
npm run deploy:docker       # Deploy with Docker
```

**Development:**
```bash
npm run dev                 # Start development mode
npm run dev:server          # Start backend dev server
npm run start:webapp        # Start webapp dev server
```

**Testing & Quality:**
```bash
npm run test                # Run backend tests
npm run test:webapp         # Run webapp tests
npm run lint                # Lint backend
npm run lint:webapp         # Lint webapp
npm run type-check          # Type check backend
npm run type-check:webapp   # Type check webapp
npm run validate            # Run all validation checks
```

**Monitoring:**
```bash
npm run logs                # Monitor logs
npm run monitor             # Health monitoring
npm run selfheal            # Self-healing automation
```

### PowerShell Scripts

#### Merge-Branches.ps1

High-performance automated branch merge script with parallel processing.

**Key Features:**
- Parallel job execution (up to 8 branches simultaneously)
- Git worktree support for true parallel safety
- Intelligent conflict resolution with caching
- Comprehensive testing and validation
- Performance monitoring and benchmarking
- Self-healing mechanisms

**Quick Start:**
```powershell
# Merge specific branches
./scripts/Merge-Branches.ps1 -SourceBranches @("feature/auth", "feature/api")

# Auto-sweep all feature branches
./scripts/Merge-Branches.ps1 -AutoSweep -MaxParallelJobs 8

# Dry run (test without changes)
./scripts/Merge-Branches.ps1 -SourceBranches @("feature/test") -DryRun
```

**Documentation:** See [docs/MERGE_AUTOMATION.md](../docs/MERGE_AUTOMATION.md) for full documentation.

#### Test-MergeBranches.ps1

Test suite for validating the Merge-Branches.ps1 script.

**Usage:**
```powershell
./scripts/Test-MergeBranches.ps1
```

### Shell Scripts

#### master.sh (Master Orchestration)

**NEW**: Comprehensive 11-step production-ready orchestration pipeline.

Orchestrates the complete build, validation, and deployment pipeline including:
- Environment validation
- Dependency installation
- Type-checking
- Linting
- Auto-fix
- Backend build
- Webapp build
- Database migrations
- API health checks
- Build validation
- Git operations

**Usage:**
```bash
npm run master
# Or directly
./scripts/master.sh
```

**Documentation:** See [AUTOMATION_GUIDE.md](../AUTOMATION_GUIDE.md) for comprehensive guide.

#### env-check.sh

Validates required environment variables are present.

**Usage:**
```bash
npm run env-check
# Or directly
./scripts/env-check.sh
```

#### env-sync-check.sh

**NEW**: Ensures `.env.example` is synchronized with production requirements.

Validates:
- All required variables are documented
- No real secrets in templates
- Security audit for committed secrets

**Usage:**
```bash
npm run env-sync
# Or directly
./scripts/env-sync-check.sh
```

#### db-migrate.sh

**NEW**: Runs database migrations and seed data.

**Usage:**
```bash
npm run db-migrate
# Or directly
./scripts/db-migrate.sh
```

**Requirements:**
- PostgreSQL client tools (`psql`)
- Database environment variables configured

#### validate-build.sh

Validates all build artifacts are present and correct.

**Usage:**
```bash
npm run validate-build
# Or directly
./scripts/validate-build.sh
```

#### health-check.sh

Comprehensive system health monitoring.

**Usage:**
```bash
npm run health
# Or directly
./scripts/health-check.sh
```

**Checks:**
- Backend service availability
- Webapp service availability
- Database connectivity
- Solana RPC endpoint health
- Environment variables
- System resources

#### auto-fix.sh

Automatically fixes common code issues.

**Usage:**
```bash
./scripts/auto-fix.sh
```

#### gxq-selfheal.sh

Self-healing automation for production issues.

**Usage:**
```bash
npm run selfheal
# Or directly
./scripts/gxq-selfheal.sh
```

#### performance-report.sh

Generates performance metrics report.

**Usage:**
```bash
npm run perf
# Or directly
./scripts/performance-report.sh
```

#### merge-coverage.sh

Merges code coverage reports from backend and webapp.

**Usage:**
```bash
./scripts/merge-coverage.sh
```

#### migrate-to-railway.sh

Migration script for Railway deployment.

**Usage:**
```bash
./scripts/migrate-to-railway.sh
```

#### deploy-vercel.sh

Deploys webapp to Vercel.

**Usage:**
```bash
npm run deploy:vercel
# Or directly
./scripts/deploy-vercel.sh
```

#### deploy-railway.sh

Deploys backend to Railway.

**Usage:**
```bash
npm run deploy:railway
# Or directly
./scripts/deploy-railway.sh
```

#### deploy-docker.sh

Builds and deploys using Docker.

**Usage:**
```bash
npm run deploy:docker
# Or directly
./scripts/deploy-docker.sh
```

#### monitor-logs.sh

Monitors application logs.

**Usage:**
```bash
npm run logs
# Or directly
./scripts/monitor-logs.sh
```

#### setup-env.sh

Sets up environment variables and configuration.

**Usage:**
```bash
./scripts/setup-env.sh
```

### TypeScript Scripts

#### pre-deploy-check.ts

Pre-deployment validation checks.

**Usage:**
```bash
npx ts-node scripts/pre-deploy-check.ts
```

#### testFarcaster.ts

Farcaster integration testing.

**Usage:**
```bash
npx ts-node scripts/testFarcaster.ts
```

#### validate-endpoints.ts

API endpoint validation.

**Usage:**
```bash
npx ts-node scripts/validate-endpoints.ts
```

## Requirements

### PowerShell Scripts
- PowerShell 7.0 or higher
- Git 2.30 or higher
- Node.js 18+ (for testing)

### Shell Scripts
- Bash 4.0 or higher
- Git
- Standard Unix utilities

### TypeScript Scripts
- Node.js 18+
- ts-node
- TypeScript 5.0+

## Installation

### PowerShell (if not installed)

**macOS:**
```bash
brew install powershell
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install -y powershell
```

**Windows:**
```powershell
winget install Microsoft.PowerShell
```

## Contributing

When adding new scripts:

1. Add proper documentation header
2. Include usage examples
3. Add error handling
4. Update this README
5. Add tests if applicable
6. Follow existing code style

## Script Naming Conventions

- **PowerShell**: `Verb-Noun.ps1` (e.g., `Merge-Branches.ps1`)
- **Shell**: `kebab-case.sh` (e.g., `merge-coverage.sh`)
- **TypeScript**: `camelCase.ts` (e.g., `testFarcaster.ts`)

## Security

- Never commit secrets or API keys in scripts
- Use environment variables for sensitive data
- Validate all user inputs
- Use `.gitignore` for generated files

## Support

For issues or questions:
- GitHub Issues: [SMSDAO/reimagined-jupiter/issues](https://github.com/SMSDAO/reimagined-jupiter/issues)
- Documentation: [GitHub Wiki](https://github.com/SMSDAO/reimagined-jupiter/wiki)
