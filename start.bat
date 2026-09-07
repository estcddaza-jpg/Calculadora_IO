@echo off
echo =========================================
echo   Calculadora IO - Sistema de Arranque
echo =========================================
echo.

echo [1/2] Iniciando Backend (FastAPI - Puerto 8000)...
start "Backend - FastAPI" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend (Next.js - Puerto 3000)...
start "Frontend - Next.js" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak > nul

echo.
echo =========================================
echo   Sistema listo!
echo   Backend: http://127.0.0.1:8000
echo   API Docs: http://127.0.0.1:8000/docs
echo   Frontend: http://localhost:3000
echo =========================================
echo.
start "" "http://localhost:3000"
pause
