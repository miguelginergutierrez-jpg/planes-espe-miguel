@echo off
cd /d "%~dp0"
set "APP_NODE=C:\Users\mginer\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%APP_NODE%" (
  "%APP_NODE%" server.cjs --lan
) else (
  node server.cjs --lan
)
pause
