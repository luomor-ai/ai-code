@echo off
echo =========================================
echo   多人实时对战消消乐 App 启动脚本
echo =========================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 未检测到 Node.js，请先安装 Node.js
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js 已安装
node --version
echo ✓ npm 已安装
npm --version
echo.

REM 进入服务器目录
cd server

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    call npm install
    echo.
)

echo 🚀 正在启动服务器...
echo.
echo =========================================
echo   服务器地址: http://localhost:3000
echo   按 Ctrl+C 停止服务器
echo =========================================
echo.

REM 启动服务器
call npm start
