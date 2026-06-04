@echo off
cd /d "%~dp0"

echo.
echo ========================================
echo    Image Gallery
echo ========================================
echo.

start "" cmd /c "timeout /t 2 >nul && start http://localhost:3456"
node server.js

pause
