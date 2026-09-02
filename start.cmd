@echo off
setlocal
title CHRONOS - tryb diagnostyczny
cd /d "%~dp0"

echo.
echo   CHRONOS - uruchomienie z widoczna konsola
echo   (normalnie klikasz CHRONOS.vbs - to jest wersja do sprawdzania bledow)
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo   Nie znaleziono Pythona w PATH.
    echo   Pobierz z python.org i zaznacz "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

python chronos.py
echo.
echo   CHRONOS zakonczony.
pause
