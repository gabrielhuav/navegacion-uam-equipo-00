@echo off
cd /d "%~dp0"
rem Con Node.js: servidor local (Guardar escribe en esta carpeta). Sin Node.js: el visor autonomo como archivo.
where node >nul 2>nul
if errorlevel 1 (
  start "" "%~dp0Visor_UAM_autonomo.html"
  exit /b
)
start "UAM Cuajimalpa" /min node server.mjs
start "" "http://127.0.0.1:8769/Visor_UAM_autonomo.html"
