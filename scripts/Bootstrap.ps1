Param(
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

function Assert-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' is not available in PATH."
  }
}

function Ensure-SecureJwtSecret {
  param([string]$EnvPath)

  if (-not (Test-Path $EnvPath)) {
    return
  }

  $content = Get-Content $EnvPath -Raw
  $pattern = '(?m)^JWT_SECRET=(.*)$'
  $match = [regex]::Match($content, $pattern)

  if (-not $match.Success) {
    return
  }

  $current = $match.Groups[1].Value.Trim()
  if ($current -and $current -notmatch '(?i)replace_with|your_|changeme|placeholder') {
    return
  }

  $bytes = New-Object byte[] 48
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $secret = [Convert]::ToBase64String($bytes)
  $updated = [regex]::Replace($content, $pattern, "JWT_SECRET=$secret", 1)
  Set-Content -Path $EnvPath -Value $updated -NoNewline
  Write-Host "[TradeOS Bootstrap] Generated secure JWT_SECRET in $EnvPath"
}

Write-Host '[TradeOS Bootstrap] Validating environment...'
Assert-Command -Name 'node'
Assert-Command -Name 'npm'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '[TradeOS Bootstrap] Installing root dependencies...'
npm ci --no-audit --no-fund

if (Test-Path "$root/webapp/package.json") {
  Write-Host '[TradeOS Bootstrap] Installing webapp dependencies...'
  Push-Location "$root/webapp"
  npm ci --no-audit --no-fund
  Pop-Location
}

if (Test-Path "$root/apps/api/package.json") {
  Write-Host '[TradeOS Bootstrap] Installing API dependencies...'
  Push-Location "$root/apps/api"
  npm ci --no-audit --no-fund
  Pop-Location
}

if (-not (Test-Path "$root/.env") -and (Test-Path "$root/.env.example")) {
  Copy-Item "$root/.env.example" "$root/.env"
  Write-Host '[TradeOS Bootstrap] Created root .env from .env.example'
  Ensure-SecureJwtSecret -EnvPath "$root/.env"
}

if (-not (Test-Path "$root/apps/api/.env") -and (Test-Path "$root/apps/api/.env.example")) {
  Copy-Item "$root/apps/api/.env.example" "$root/apps/api/.env"
  Write-Host '[TradeOS Bootstrap] Created apps/api .env from .env.example'
  Ensure-SecureJwtSecret -EnvPath "$root/apps/api/.env"
}

if (-not $SkipBuild) {
  Write-Host '[TradeOS Bootstrap] Building project...'
  npm run build
}

Write-Host '[TradeOS Bootstrap] Next steps:'
Write-Host '  - Backend: npm run start:server'
Write-Host '  - Webapp : npm run start:webapp'
Write-Host '[TradeOS Bootstrap] Complete.'
