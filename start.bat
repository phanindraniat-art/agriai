@echo off
title AgriSmart AI Server
echo ===================================================
echo   Starting AgriSmart AI Server & SQLite Backend...
echo ===================================================

cd /d "%~dp0"

REM Check for agy-node or node
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo Using Node.js from PATH...
    start http://localhost:3000
    node server.js
    goto :end
)

if exist "%USERPROFILE%\AppData\Roaming\Antigravity\bin\agy-node.cmd" (
    echo Using Antigravity bundled Node runtime...
    start http://localhost:3000
    call "%USERPROFILE%\AppData\Roaming\Antigravity\bin\agy-node.cmd" server.js
    goto :end
)

echo [ERROR] Node.js was not found. Please install Node.js (v18+) or run via agy-node.
pause

:end
