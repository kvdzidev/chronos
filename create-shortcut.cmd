@echo off
setlocal
title CHRONOS - skrot na pulpicie
cd /d "%~dp0"

rem Tworzy CHRONOS.lnk (z ikona chronos.ico) wskazujacy na CHRONOS.vbs.
rem Domyslnie na pulpicie; inny folder mozna podac jako argument:
rem     create-shortcut.cmd "D:\Moje skroty"

set "TARGET_DIR=%~1"
if "%TARGET_DIR%"=="" (
    for /f "usebackq delims=" %%D in (`powershell -NoProfile -Command "[Environment]::GetFolderPath('Desktop')"`) do set "TARGET_DIR=%%D"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$s = (New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $env:TARGET_DIR 'CHRONOS.lnk'));" ^
  "$s.TargetPath = Join-Path $env:SystemRoot 'System32\wscript.exe';" ^
  "$s.Arguments = '\"' + (Join-Path (Get-Location) 'CHRONOS.vbs') + '\"';" ^
  "$s.WorkingDirectory = (Get-Location).Path;" ^
  "$s.IconLocation = (Join-Path (Get-Location) 'chronos.ico') + ',0';" ^
  "$s.Description = 'CHRONOS - time tracker';" ^
  "$s.Save()"

if errorlevel 1 (
    echo.
    echo   Nie udalo sie utworzyc skrotu.
    pause
    exit /b 1
)

echo.
echo   Gotowe: %TARGET_DIR%\CHRONOS.lnk
echo.
if "%~1"=="" pause
