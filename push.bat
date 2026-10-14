@echo off
title Push AgriSmart AI to GitHub
cd /d "%~dp0"
set "PATH=C:\Users\test2\AppData\Local\Programs\MinGit\cmd;%PATH%"

echo ========================================================
echo   Pushing AgriSmart AI to:
echo   https://github.com/phanindraniat-art/agriai.git
echo ========================================================
echo.
echo Note: When prompted for password, enter your GitHub Personal Access Token (PAT).
echo GitHub requires a Personal Access Token instead of your account password.
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  [SUCCESS] Successfully pushed to GitHub!
    echo ========================================================
) else (
    echo.
    echo [TIP] If authentication failed:
    echo 1. Generate a Personal Access Token at: https://github.com/settings/tokens
    echo    (Select 'repo' scope: full control of private repositories)
    echo 2. Run:
    echo    git push https://<YOUR_TOKEN>@github.com/phanindraniat-art/agriai.git main
)

echo.
pause
