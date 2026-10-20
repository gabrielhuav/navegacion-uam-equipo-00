@echo off
cd /d "%~dp0"
start "UAM Lerma" /min node server.mjs
start "" "http://127.0.0.1:8772/Visor_UAM_autonomo.html"
