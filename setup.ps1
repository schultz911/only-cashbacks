# OnlyCashbacks Setup Script for Windows PowerShell
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Initializing OnlyCashbacks Setup for Jules" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Verify Node.js and npm presence
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Error: Node.js is not installed or not in PATH."
    exit 1
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "Error: npm is not installed or not in PATH."
    exit 1
}

$nodeVersion = (node -v).Trim()
$npmVersion = (npm -v).Trim()
Write-Host "[OK] Node.js $nodeVersion and npm $npmVersion detected." -ForegroundColor Green

# 2. Handle environment configuration file (.env)
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "[OK] .env file created successfully." -ForegroundColor Green
} else {
    Write-Host "[OK] .env file already exists." -ForegroundColor Green
}

# 3. Install project dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
Write-Host "[OK] Dependencies installed successfully." -ForegroundColor Green

# 4. Verify the setup by running a clean build
Write-Host "Running validation build..." -ForegroundColor Yellow
npm run build
Write-Host "[OK] Validation build completed successfully." -ForegroundColor Green

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Setup completed successfully! Ready for Jules." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
