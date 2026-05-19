@echo off
cd /d "%~dp0"
echo Liberando puerto 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTEN') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo.
echo Iniciando servidor...
npm run dev
pause