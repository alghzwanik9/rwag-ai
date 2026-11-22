@echo off
setlocal enabledelayedexpansion

echo ============================================
echo  Rwaq AI - Local Development Launcher
echo ============================================
echo.
echo [0/3] Cleaning up processes listening on ports 8000 and 3000...
for %%P in (8000 3000) do (
    for /f "tokens=5" %%A in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
        if not "%%A"=="0" (
            echo   Stopping PID %%A on port %%P...
            taskkill /F /PID %%A >nul 2>&1
        )
    )
)

echo.
echo [1/3] Checking Python virtual environment (.venv)...
if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] .venv not found. Create it first:
    echo   python -m venv .venv
    echo   .venv\Scripts\activate.bat
    echo   pip install -r requirements.txt
    pause
    exit /b 1
)
call .venv\Scripts\activate.bat

echo.
echo [2/3] Starting FastAPI backend on http://127.0.0.1:8000 ...
start "Rwaq-Backend" cmd /k "call .venv\Scripts\activate.bat && uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo.
echo [3/3] Starting Next.js frontend on http://localhost:3000 ...
start "Rwaq-Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo  Both servers are starting in separate windows.
echo  Frontend : http://localhost:3000
echo  Backend  : http://127.0.0.1:8000
echo  DB Check : http://127.0.0.1:8000/api/v1/db-check
echo ============================================
pause
