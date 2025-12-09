@echo off
chcp 65001 >nul
title Symposium IM - 一键启动

echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║   ✦ SYMPOSIUM IM 即时通讯系统                         ║
echo ║   ─────────────────────────────────────────────────   ║
echo ║   正在启动服务...                                     ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

:: 启动后端
echo [1/2] 启动后端服务 (端口 50001)...
start "Symposium Backend" cmd /k "cd /d %~dp0server && npm run dev"

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端
echo [2/2] 启动前端服务 (端口 30001)...
start "Symposium Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║   ✓ 服务已启动！                                      ║
echo ║                                                       ║
echo ║   前端: http://localhost:30001                        ║
echo ║   后端: http://localhost:50001                        ║
echo ║                                                       ║
echo ║   关闭此窗口不会影响运行中的服务                      ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
pause
