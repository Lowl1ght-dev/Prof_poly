@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo Освобождение портов: 5173 (Vite), 4173 (preview), 3000, 8080...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0kill-dev-ports.ps1"

echo.
echo Запуск: npm run dev
echo.
call npm run dev
