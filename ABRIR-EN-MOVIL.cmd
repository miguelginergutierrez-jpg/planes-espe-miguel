@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24 y vuelve a abrir este archivo.
  pause
  exit /b 1
)
node server.cjs --lan
pause
