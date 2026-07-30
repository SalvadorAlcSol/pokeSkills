@echo off
cd /d "%~dp0"
echo ==============================================
echo Iniciando Pokeroutes en Local...
echo ==============================================
start http://localhost:5173
call npm run dev
pause
