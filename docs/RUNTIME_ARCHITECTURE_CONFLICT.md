# RUNTIME ARCHITECTURE CONFLICT - CRITICAL ISSUE

**Status**: BLOCKING PRODUCTION RELEASE  
**Severity**: CRITICAL  
**Date Identified**: 2026-09-27

---

## THE CONFLICT

TradeOS has **two incompatible backend runtimes** that are serving the same purpose but with completely different architectures and capabilities:

### Runtime 1: `src/server.ts` (Express HTTP API)
**Purpose**: Persistent backend server for production deployments

```typescript
// File: src/server.ts
// Lines: 423

// Features:
- Express.js HTTP server
- Port: 3000
- Health check endpoints: /api/health, /healthz, /ready
- Metrics endpoint: /api/metrics
- Bot control API: /api/control (start/stop/pause/resume)
- Continuous monitoring loop (monitoringLoop())
- Graceful shutdown handling
- Kubernetes-compatible probes

// Imports:
import { scanOpportunities } from "../lib/scanner.js";
import { executeTrade } from "../lib/executor.js";

// State Management:
- isRunning: boolean
- isPaused: boolean
- scanCount: number
- opportunitiesFound: number
- tradesExecuted: number
- totalProfit: number
- connection: Solana Connection
- keypair: Keypair
```

**Deployment Targets**:
- Docker Compose (docker-compose.yml, line 4-73)
- Railway (railway.json)
- AWS/Azure/Alibaba (via Docker)
- Kubernetes (health probes)

**Status**: ✅ Lightweight, focused on execution

---

### Runtime 2: `src/index.ts` (CLI + Full Application)
**Purpose**: Feature-rich CLI with all trading logic

```typescript
// File: src/index.ts
// Lines: 687

// Features:
- GXQStudio class with full trading engine
- 40+ commands (airdrops, scan, start, manual, providers, etc.)
- QuickNode integration (full suite)
- Preset manager
- Airdrop checker
- Auto-execution engine
- Flash loan arbitrage
- Triangular arbitrage
- Address book management
- Wallet scoring
- Route templates
- Enhanced scanner
- Database layer (ArbitrageDatabase)
- Real-time scanner
- Historical analysis

// Imports (30+ imports):
import { PresetManager } from "./services/presetManager.js";
import { AirdropChecker } from "./services/airdropChecker.js";
import { AutoExecutionEngine } from "./services/autoExecution.js";
import { FlashLoanArbitrage, TriangularArbitrage } from "./strategies/arbitrage.js";
import { AddressBook } from "./services/addressBook.js";
import { WalletScoring } from "./services/walletScoring.js";
import { RouteTemplateManager } from "./services/routeTemplates.js";
import { EnhancedArbitrageScanner } from "./services/enhancedScanner.js";
import { ArbitrageDatabase } from "./services/database.js";
import { RealTimeArbitrageScanner } from "./services/realTimeArbitrageScanner.js";
// ... plus many more
```

**Entry Point**: `npm start <command>`

**Status**: ✅ Feature-rich but CLI-only

---

## THE ARCHITECTURAL PROBLEM

### What Currently Happens

1. **Production Deployment** (Docker/Railway):
   ```bash
   # Dockerfile CMD
   CMD ["node", "dist/src/server.ts"]
   
   # Result: Lightweight HTTP server
   # Has: Health checks, basic monitoring loop
   # Missing: All trading logic, database, analyzers, etc.
   ```

2. **Local/Development** (CLI):
   ```bash
   npm start scan
   npm start start  # auto-execution
   npm start manual
   
   # Result: Full feature access
   # Has: Complete trading engine
   # Missing: HTTP API, persistent background service
   ```

3. **The Gap**:
   - Production deployment via Docker = no real trading capabilities
   - Local development = must run CLI manually, no persistent background service
   - Webapp (Next.js) = cannot call trading endpoints on persistent backend
   - No unified architecture

### Evidence from Code

**In `src/server.ts` (line 24-25)**:
```typescript
import { scanOpportunities } from "../lib/scanner.js";
import { executeTrade } from "../lib/executor.js";
```

These are STUBS that don't have access to:
- PresetManager logic
- AutoExecutionEngine
- AirdropChecker
- Database
- RealTimeScanner
- WalletScoring
- ... 20+ other services

**Result**: The production server can call `scanOpportunities()` and `executeTrade()`, but without the full business logic layer, these are incomplete implementations.

---

## IMPACT ASSESSMENT

### 1. Production Deployment
**Status**: ❌ NOT PRODUCTION READY
- Docker/Railway deployments are missing core functionality
- Trading engine is incomplete
- Webapp frontend has nowhere to send real trading requests

### 2. Database Integration
**Status**: ⚠️ UNCLEAR
- `src/index.ts` has `ArbitrageDatabase` class
- `src/server.ts` has no database integration
- Metrics in server.ts are in-memory only
- No persistence between server restarts

### 3. Trading Safety
**Status**: ⚠️ QUESTIONABLE
- server.ts has no risk engine reference
- server.ts has no configuration validation
- server.ts does NOT call `enforceProductionSafety()` (only in index.ts, line 78)

### 4. API Contracts
**Status**: ❌ UNDEFINED
- Webapp expects certain endpoints
- server.ts provides different endpoints
- No documented API contract

---

## MANDATORY FIXES (BLOCKING RELEASE)

### Fix 1: Consolidate Runtimes
**Option A: Extend server.ts**
- Import and integrate all services from index.ts
- Add Express routes for all trading operations
- Becomes primary production runtime
- Keep index.ts as CLI wrapper around API

**Option B: Replace server.ts**
- Delete server.ts
- Wrap index.ts classes in Express routes
- Provides full feature access via HTTP
- Becomes primary production runtime

### Fix 2: Database Integration
- Ensure ArbitrageDatabase is initialized in production server
- All metrics persisted to database
- Migrations validated
- Connection pooling configured

### Fix 3: API Contract Documentation
- Define all endpoints (trading, health, metrics, admin)
- Request/response schemas
- Error codes and handling
- Rate limiting strategy

### Fix 4: Production Validation
- Ensure production server passes all validations
- Risk engine engaged
- Emergency kill switch available
- Auto-execution disabled by default

---

## RESOLUTION STRATEGY

### Phase 1: Choose Canonical Runtime
**Decision**: Consolidate to `src/server.ts` (Express-first)

**Rationale**:
- Persistent deployment requires HTTP service
- Webapp (Next.js) frontend requires API
- CLI can wrap HTTP API calls
- Cleaner separation of concerns

### Phase 2: Integrate Services
Add to `src/server.ts`:
```typescript
// Initialize all services
const studio = new GXQStudio();
await studio.initialize();

// Add routes for:
// - POST /api/scan - trigger scan
// - POST /api/execute - execute trade
// - GET /api/opportunities - recent opportunities
// - POST /api/presets - manage presets
// - GET /api/wallet/score - wallet analysis
// - etc.
```

### Phase 3: CLI Refactor
Create `cli/index.ts` that wraps HTTP API:
```typescript
// Instead of direct class calls
// Call: http://localhost:3000/api/scan
// Call: http://localhost:3000/api/execute
// Parse JSON responses and format for CLI
```

### Phase 4: Validation
- [ ] server.ts builds successfully
- [ ] All lib/* imports work
- [ ] Database connection works
- [ ] RPC connection works
- [ ] Risk engine initialized
- [ ] Health checks return 200
- [ ] Metrics endpoint works
- [ ] At least one API endpoint works end-to-end

---

## FILES AFFECTED

**Must Be Modified**:
- `src/server.ts` - add full trading engine integration
- `src/index.ts` - refactor to HTTP client wrapper
- `Dockerfile` - verify build
- `docker-compose.yml` - verify ports and networking
- `tsconfig.json` - verify includes

**Must Be Created**:
- `src/api/routes/*` - dedicated route files
- `src/services/api/*.ts` - API middleware
- `docs/API_CONTRACT.md` - endpoint documentation

**Must Be Deleted**:
- `src/index-railway.ts` - legacy
- `src/index-vercel.ts` - legacy (if exists)

---

## TIMELINE TO RESOLUTION

This is a BLOCKING issue. Production release cannot proceed until resolved.

**Estimated effort**: 2-3 days
**Risk level**: HIGH (core architecture change)
**Rollback plan**: Revert branch

---

## VERIFICATION CHECKLIST

Before declaring this resolved:

- [ ] Single canonical Express server (src/server.ts)
- [ ] All GXQStudio services imported and initialized
- [ ] Database layer integrated
- [ ] All API routes documented
- [ ] CLI refactored to call API
- [ ] Full build successful
- [ ] All tests passing
- [ ] Health checks working
- [ ] Metrics working
- [ ] End-to-end trade simulation successful
- [ ] Production guardrails engaged
- [ ] Risk engine active
- [ ] No mock/placeholder implementations
