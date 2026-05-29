@echo off
echo Killing any running Python/Node processes on ports 3000 and 8000...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM uvicorn.exe /T >nul 2>&1

echo.
echo [1/3] Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo [2/3] Starting FastAPI backend on 0.0.0.0:8000 ...
start "Rwaq-Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo [3/3] Starting Next.js frontend on 0.0.0.0:3000 ...
start "Rwaq-Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================
echo  Both servers starting in separate windows.
echo  Backend  : http://0.0.0.0:8000
echo  Frontend : http://0.0.0.0:3000
echo  Mobile   : http://10.191.111.242:3000
echo ============================================
pause
