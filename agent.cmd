@echo off
setlocal
title CHRONOS - agent lokalny
cd /d "%~dp0"

where python >nul 2>nul
if errorlevel 1 (
    echo.
    echo   Nie znaleziono Pythona w PATH.
    echo   Agent go wymaga - CHRONOS bez agenta dziala normalnie, tylko recznie.
    echo.
    pause
    exit /b 1
)

python agent.py
pause
