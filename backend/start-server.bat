@echo off
cd /d "D:\CROMA\CROMA-jeter_dev\backend"
echo Liberando puerto 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTEN') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
start /B npm run dev > server.log 2>&1
echo Servidor iniciado en puerto 3000