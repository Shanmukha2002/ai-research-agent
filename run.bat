@echo off
echo Starting AI Research Agent...

:: Start PostgreSQL
echo Starting PostgreSQL...
net start postgresql-x64-18 2>nul
timeout /t 2 /nobreak >nul

:: Start Backend
echo Starting Backend...
start "Backend" cmd /k "cd /d C:\Users\Admin\ai-research-agent && venv\Scripts\activate && uvicorn main:app --reload"

:: Wait for backend to start
timeout /t 3 /nobreak >nul

:: Start Frontend
echo Starting Frontend...
start "Frontend" cmd /k "cd /d C:\Users\Admin\ai-research-agent\frontend && npm start"

:: Open browser
echo Opening browser...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo Done! Your app is starting...