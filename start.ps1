# Annual Report Portal - Quick Start Script (PowerShell)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Annual Report Portal - Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.12+" -ForegroundColor Red
    exit
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 20+" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Kill stale listeners on common dev ports
Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }

# Start Backend
Write-Host "Starting Backend (http://localhost:8000)..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd backend; if (Test-Path .\venv\Scripts\python.exe) { .\venv\Scripts\python.exe -m uvicorn app.main:app --reload } else { python -m uvicorn app.main:app --reload }"
) -PassThru

# Wait for backend
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend (http://localhost:5173)..." -ForegroundColor Green
$frontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd frontend; npm run dev"
) -PassThru

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Cyan
Write-Host "  - Register as a student (auto-approved)" -ForegroundColor White
Write-Host "  - Register as a lecturer (requires admin approval)" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C in any window to stop the servers" -ForegroundColor Yellow
