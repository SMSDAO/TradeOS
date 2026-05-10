#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
CI_MODE=false
SELF_HEAL_MODE=false

log() {
  printf '[converge] %s\n' "$1"
}

warn() {
  printf '[converge][warn] %s\n' "$1"
}

die() {
  printf '[converge][error] %s\n' "$1" >&2
  exit 1
}

CLASSIFICATION="none"

run_stage_command() {
  local stage="$1"

  case "$stage" in
    install)
      npm ci --no-audit --no-fund
      ;;
    webapp-install)
      npm --prefix webapp ci --no-audit --no-fund
      ;;
    lint)
      npm run lint
      npm run lint:webapp
      ;;
    typecheck)
      npm run type-check
      npm run type-check:webapp
      ;;
    test)
      npm test
      # Run webapp tests when present, but do not mask real failures when they exist.
      npm --prefix webapp run test --if-present -- --ci --coverage
      ;;
    build)
      npm run build
      ;;
    *)
      die "unknown stage command: ${stage}"
      ;;
  esac
}

classify_and_fix_once() {
  local stage="$1"

  log "stage=${stage} run"
  if run_stage_command "$stage"; then
    return 0
  fi

  case "$stage" in
    install|webapp-install)
      CLASSIFICATION="dependency_drift"
      warn "classification=${CLASSIFICATION}; applying lockfile + dedupe recipe"
      npm install --package-lock-only --ignore-scripts --no-audit --no-fund
      npm --prefix webapp install --package-lock-only --ignore-scripts --no-audit --no-fund
      npm dedupe || true
      npm --prefix webapp dedupe || true
      ;;
    lint|typecheck|test|build)
      CLASSIFICATION="stale_install"
      warn "classification=${CLASSIFICATION}; reinstalling dependencies"
      npm ci --no-audit --no-fund
      npm --prefix webapp ci --no-audit --no-fund
      ;;
    *)
      CLASSIFICATION="unknown"
      warn "classification=${CLASSIFICATION}; no fix recipe"
      ;;
  esac

  log "stage=${stage} rerun=once"
  if run_stage_command "$stage"; then
    return 0
  fi

  die "stage=${stage} failed after one bounded retry; classification=${CLASSIFICATION}"
}

verify_structure() {
  log "verify required folder structure"
  local missing=0
  local required=(src webapp scripts .github/workflows)
  for item in "${required[@]}"; do
    if [ ! -e "$item" ]; then
      warn "missing: $item"
      missing=1
    fi
  done
  [ "$missing" -eq 0 ] || die "required structure missing"
}

normalize_lockfiles() {
  log "normalize lockfiles"
  npm install --package-lock-only --ignore-scripts --no-audit --no-fund
  npm --prefix webapp install --package-lock-only --ignore-scripts --no-audit --no-fund
}

restore_generated_configs() {
  log "restore deterministic generated configs"
  if [ ! -f "webapp/next-env.d.ts" ]; then
    cat > webapp/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited.
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
EOF
  fi
}

validate_env_templates() {
  log "validate environment templates"
  [ -f .env.example ] || die ".env.example missing"
  [ -f webapp/.env.example ] || die "webapp/.env.example missing"

  grep -q '^SOLANA_RPC_URL=' .env.example || die "SOLANA_RPC_URL missing in .env.example"
  grep -q '^WALLET_PRIVATE_KEY=' .env.example || die "WALLET_PRIVATE_KEY missing in .env.example"
  grep -q '^NEXT_PUBLIC_RPC_URL=' webapp/.env.example || die "NEXT_PUBLIC_RPC_URL missing in webapp/.env.example"
}

validate_json_file() {
  local file_path="$1"
  node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));" "$file_path"
}

validate_nextjs_config() {
  log "validate next config"
  [ -f webapp/next.config.ts ] || die "webapp/next.config.ts missing"
  grep -q 'export default' webapp/next.config.ts || die "webapp/next.config.ts missing default export"
}

validate_firebase_config() {
  log "validate firebase config"
  local count
  count=$(find . -maxdepth 2 -type f \( -name 'firebase.json' -o -name 'firebase*.json' \) | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    warn "firebase config files detected; ensure environment-specific validation is handled upstream"
  fi
}

validate_vercel_config() {
  log "validate vercel config"
  [ -f webapp/vercel.json ] || die "webapp/vercel.json missing"
  validate_json_file webapp/vercel.json

  if [ -f vercel.json ]; then
    validate_json_file vercel.json
  else
    warn "root vercel.json not present; skipping root vercel config validation"
  fi
}

regenerate_deterministic_artifacts() {
  log "regenerate deterministic artifacts"
  rm -rf dist webapp/.next
}

install_dependencies() {
  classify_and_fix_once "install"
  classify_and_fix_once "webapp-install"
}

run_quality_pipeline() {
  classify_and_fix_once "lint"
  classify_and_fix_once "typecheck"
  classify_and_fix_once "test"
  classify_and_fix_once "build"
}

main() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --ci)
        CI_MODE=true
        ;;
      --self-heal)
        SELF_HEAL_MODE=true
        ;;
      *)
        die "unknown argument: $1"
        ;;
    esac
    shift
  done

  log "start deterministic convergence"
  log "mode ci=${CI_MODE} self_heal=${SELF_HEAL_MODE}"
  verify_structure
  normalize_lockfiles
  restore_generated_configs
  validate_env_templates
  regenerate_deterministic_artifacts
  install_dependencies
  validate_nextjs_config
  validate_firebase_config
  validate_vercel_config
  run_quality_pipeline
  log "convergence completed successfully"
}

main "$@"
