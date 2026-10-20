@echo off
cd /d "%~dp0"
start "" http://127.0.0.1:8782/Visor_UAM_autonomo.html
node server.mjs
pause
