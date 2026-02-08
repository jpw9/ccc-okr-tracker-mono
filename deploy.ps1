# OKR Tracker Deployment Script
# Deploys built WAR files to production server

param(
    [switch]$SkipBuild,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

# Configuration
$SERVER = "10.1.155.29"
$USER = "gitlab1"
$BACKEND_WAR = "build-output\okr-tracker-backend.war"
$FRONTEND_WAR = "build-output\okr-tracker-ui.war"
$TOMCAT_WEBAPPS = "/opt/tomcat10/webapps"

# Colors for output
function Write-Step($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Write-Success($msg) { Write-Host "   [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "   [WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "   [ERROR] $msg" -ForegroundColor Red }

Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   OKR Tracker Deployment Script" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

# Step 1: Build (unless skipped)
if (-not $SkipBuild) {
    Write-Step "Building project..."
    & .\build-for-tomcat.bat
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Build failed!"
        exit 1
    }
    Write-Success "Build completed"
}

# Verify WAR files exist
if (-not $FrontendOnly -and -not (Test-Path $BACKEND_WAR)) {
    Write-Err "Backend WAR not found: $BACKEND_WAR"
    exit 1
}
if (-not $BackendOnly -and -not (Test-Path $FRONTEND_WAR)) {
    Write-Err "Frontend WAR not found: $FRONTEND_WAR"
    exit 1
}

# Step 2: Deploy Backend
if (-not $FrontendOnly) {
    Write-Step "Deploying Backend..."
    
    Write-Host "   Uploading backend WAR to server..." -ForegroundColor Gray
    scp $BACKEND_WAR "${USER}@${SERVER}:$TOMCAT_WEBAPPS/okr-tracker-backend.war"
    
    Write-Success "Backend deployed! (Tomcat will auto-deploy)"
}

# Step 3: Deploy Frontend
if (-not $BackendOnly) {
    Write-Step "Deploying Frontend..."
    
    Write-Host "   Uploading frontend WAR to server..." -ForegroundColor Gray
    scp $FRONTEND_WAR "${USER}@${SERVER}:$TOMCAT_WEBAPPS/cccokrtracker.war"
    
    Write-Success "Frontend deployed! (Tomcat will auto-deploy)"
}

Write-Host "`n============================================" -ForegroundColor Green
Write-Host "   Deployment Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host "\nURL: https://${SERVER}:8443/cccokrtracker/"
Write-Host "API: https://${SERVER}:8443/okr-tracker-backend/api"
