# CI/CD Audit: Deterministic Convergence

## Scope
Audited all workflow files in `.github/workflows/*` and converged to deterministic production workflows.

## Final kept workflows
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/self-heal.yml`

## Removed workflow inventory
- `auto-label.yml`
- `autonomous-oracle-pipeline.yml`
- `codeql-analysis.yml`
- `complete-production-pipeline.yml`
- `deploy-preview.yml`
- `deploy-railway-preview.yml`
- `deploy-railway.yml`
- `docker-build.yml`
- `failed-job-handler.yml`
- `gxq-master-ci.yml`
- `gxq-pr-check.yml`
- `gxq-scheduled-health.yml`
- `performance-monitoring.yml`
- `powershell-merge-automation.yml`
- `rename-vercel-hosts.yml`
- `self-optimize.yml`
- `sync-railway-secrets.yml`

## Merge and convergence decisions
- Merged all CI/test/build variants into `ci.yml` with exactly 4 deterministic jobs: `lint`, `typecheck`, `test`, `build`.
- Merged security checks into `security.yml`: `audit`, `dependency-review`, `secret-scan`.
- Merged deployment logic into `deploy.yml`:
  - production deploy gated by successful `ci` workflow on `main` via `workflow_run`
  - preview deploy retained as optional non-blocking PR job.
- Replaced self-mutating/self-optimizing automation with bounded `self-heal.yml` running deterministic `scripts/converge.sh` only.

## Risk analysis
### Removed high-risk patterns
- Workflow self-mutation (`git commit`/`git push` in workflows).
- Recursive and unstable retry cascades.
- Duplicate deploy paths (Vercel + Railway + Docker pipelines racing each other).
- Comment/label automation coupled to deployment behavior.
- Multi-pipeline overlap producing non-deterministic branch status outcomes.

### Current controlled risks
- Preview deployment can still fail due to provider variability, but it is explicitly non-blocking.
- Production deployment is gated by successful CI on `main` and now gracefully skips when provider infrastructure is not configured.

## Workflow dependency graph
- `ci` (PR + push main)
  - jobs: `lint` -> independent
  - jobs: `typecheck` -> independent
  - jobs: `test` -> independent
  - jobs: `build` -> independent
- `security` (PR + push main + scheduled)
  - jobs: `audit`, `dependency-review`, `secret-scan`
- `deploy`
  - `production` depends on `workflow_run(conclusion=success, head_branch=main, workflow=ci)`
  - both `preview` and `production` are optional/non-blocking until deployment provider infrastructure is configured
- `self-heal`
  - scheduled/manual bounded converge execution
  - no workflow mutation, no commit, no PR merge, no recursive trigger chain

## Determinism controls added
- Pinned Node version through `.nvmrc` in all workflows.
- `npm ci` used for lockfile-based install determinism.
- Single package manager path (npm) across root and webapp.
- Removed `continue-on-error` from required CI jobs.
- Removed auto-commit and workflow mutation behavior.
- Added bounded failure handling in `scripts/converge.sh`:
  - failure -> classify -> known fix recipe -> rerun once -> stop.

## Migration notes
1. Required checks should be updated to new check names from `ci` and `security` workflows.
2. Legacy required checks from removed workflows must be removed in branch protection.
3. If Railway deploys are still needed, keep them external to required convergence path and not coupled to CI required checks.
4. `scripts/converge.sh` and `scripts/doctor.ts` can be executed locally for deterministic preflight.

## Rollback notes
1. Revert this PR commit to restore previous workflow set.
2. Reapply old branch protection required checks matching restored workflow names.
3. Re-run CI and deploy pipelines to re-establish prior status checks.

## Justification summary
This convergence removes workflow entropy, recursion, and self-mutation while preserving core production controls: deterministic CI validation, security audit, gated production deploy from `main`, and bounded non-mutating self-heal routines.
