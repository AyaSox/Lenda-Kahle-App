# ?? Lenda Kahle - Quick Deploy Script
# This script prepares your app for deployment

Write-Host "???? Lenda Kahle Deployment Preparation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
if (-not (Test-Path "LendaKahleApp.Server/LendaKahleApp.Server.csproj")) {
    Write-Host "? Error: Run this script from the root directory (LendaKahleApp/)" -ForegroundColor Red
    exit 1
}

Write-Host "? Directory check passed" -ForegroundColor Green
Write-Host ""

# Check if Git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "??  Git not initialized. Initializing..." -ForegroundColor Yellow
    git init
    Write-Host "? Git initialized" -ForegroundColor Green
} else {
    Write-Host "? Git already initialized" -ForegroundColor Green
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "??  You have uncommitted changes:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $commit = Read-Host "Commit all changes? (y/n)"
    
    if ($commit -eq "y") {
        git add .
        $message = Read-Host "Commit message"
        if (-not $message) {
            $message = "Prepare for deployment"
        }
        git commit -m $message
        Write-Host "? Changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "? No uncommitted changes" -ForegroundColor Green
}

Write-Host ""
Write-Host "?? Checking required files..." -ForegroundColor Cyan

$requiredFiles = @(
    "Dockerfile",
    "render.yaml",
    ".dockerignore",
    "lendakahleapp.client/vercel.json",
    "lendakahleapp.client/.env.production"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ? $file" -ForegroundColor Green
    } else {
        Write-Host "  ? $file missing" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "? Some required files are missing!" -ForegroundColor Red
    Write-Host "   Please check DEPLOYMENT_GUIDE_SPLIT_STACK.md" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "?? Testing builds..." -ForegroundColor Cyan

# Test backend build
Write-Host "  Building backend..." -ForegroundColor Yellow
Push-Location LendaKahleApp.Server
$backendBuild = dotnet build --configuration Release 2>&1
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ? Backend builds successfully" -ForegroundColor Green
} else {
    Write-Host "  ? Backend build failed" -ForegroundColor Red
    Write-Host "  Run 'dotnet build' in LendaKahleApp.Server for details" -ForegroundColor Yellow
    exit 1
}

# Test frontend build
Write-Host "  Building frontend..." -ForegroundColor Yellow
Push-Location lendakahleapp.client
$frontendBuild = npm run build 2>&1
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ? Frontend builds successfully" -ForegroundColor Green
} else {
    Write-Host "  ? Frontend build failed" -ForegroundColor Red
    Write-Host "  Run 'npm run build' in lendakahleapp.client for details" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "?? Deployment Preparation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "?? Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Create Supabase account and database" -ForegroundColor White
Write-Host "  2. Deploy backend to Render.com" -ForegroundColor White
Write-Host "  3. Deploy frontend to Vercel" -ForegroundColor White
Write-Host ""
Write-Host "?? Full Guide: DEPLOYMENT_GUIDE_SPLIT_STACK.md" -ForegroundColor Yellow
Write-Host "? Checklist: DEPLOYMENT_CHECKLIST.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "?? Generate JWT Secret:" -ForegroundColor Cyan
Write-Host "   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]`$_})" -ForegroundColor Gray
Write-Host ""
Write-Host "Siyabonga! Good luck with deployment! ????" -ForegroundColor Green
