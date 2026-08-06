@echo off
cd /d "%~dp0"
echo ==============================================
echo Iniciando Pokeroutes en Local...
echo ==============================================
start http://localhost:5180
call npm run dev
pause
