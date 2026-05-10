# Branch Protection Recommendations (main)

## Required checks
Set **only** these required checks:
- `ci / lint`
- `ci / typecheck`
- `ci / test`
- `ci / build`
- `security / audit`

## Protection settings
- Protect `main` branch.
- Require pull request before merge.
- Require at least 1 approval.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution before merge.
- Require branches to be up to date before merging.
- Require linear history.
- Restrict force pushes.
- Restrict branch deletion.

## Merge policy
- Allow squash merge or rebase merge.
- Disable merge commits if linear history is enforced.
- Do not enable auto-merge for CI convergence branch policy.

## Release gating
- Production deployment only from `main` and only after successful `ci` workflow.
- Preview deployment must remain non-blocking and must not be required for merge.
- Security audit check remains required.

## Operational guidance
- Remove legacy required checks from deleted workflows before enabling new required checks.
- Revisit required checks only when workflow names or job names intentionally change.
