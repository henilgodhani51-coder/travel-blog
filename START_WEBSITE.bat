@echo off
title WanderWave Travel Blog Launcher
color 0B
echo =========================================================
echo       Starting WanderWave Travel Blog Platform           
echo =========================================================
echo.
cd /d "%~dp0"

echo [1/3] Checking Node.js environment...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found. Please install Node.js from https://nodejs.org
    pause
    exit /b
)

echo [2/3] Starting Travel Blog Server on port 3000...
start "" http://localhost:3000

echo [3/3] Server running at: http://localhost:3000
echo.
echo Press Ctrl+C in this window anytime to stop the server.
echo =========================================================
node server.js
pause
