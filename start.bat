@echo off
REM Annual Report Portal - Quick Start Script

echo =====================================
echo Annual Report Portal - Setup
echo =====================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    exit /b 1
)

echo Python and Node.js found. Starting setup...
echo.

REM Kill stale processes using backend/frontend ports to avoid old broken instances
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

REM Start backend server in new window
echo Starting Backend Server (http://localhost:8000)...
start cmd /k "cd /d backend && if exist venv\Scripts\python.exe (venv\Scripts\python.exe -m uvicorn app.main:app --reload) else (python -m uvicorn app.main:app --reload)"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start frontend dev server in new window
echo Starting Frontend Server (http://localhost:5173)...
echo.
start cmd /k "cd /d frontend && npm run dev"

echo.
echo =====================================
echo Setup Complete!
echo =====================================
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Test Credentials:
echo - Register as a student (auto-approved)
echo - Register as a lecturer (requires admin approval)
echo.
pause
