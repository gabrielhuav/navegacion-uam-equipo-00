@echo off
cd /d "%~dp0"
start "UAM Xochimilco" /min node server.mjs
start "" "http://127.0.0.1:8771/Visor_UAM_autonomo.html"
