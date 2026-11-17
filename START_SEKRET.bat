@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js 20+ and try again.
  pause
  exit /b 1
)
echo.
echo SEKRET TOOLS LAB v4.0
echo Open http://127.0.0.1:5173 after the server starts.
echo.
call npm run dev
pause
