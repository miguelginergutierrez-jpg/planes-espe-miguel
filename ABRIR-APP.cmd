@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24 y vuelve a abrir este archivo.
  pause
  exit /b 1
)
echo Abre http://localhost:4173/ en el navegador.
echo Manten esta ventana abierta mientras uses la app.
node server.cjs
pause
