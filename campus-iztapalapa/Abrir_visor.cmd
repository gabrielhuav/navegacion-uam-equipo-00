@echo off
cd /d "%~dp0"
start "UAM Iztapalapa" /min node server.mjs
start "" "http://127.0.0.1:8770/Visor_UAM_autonomo.html"
