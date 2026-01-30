@echo off
chcp 65001 >nul
echo ================================
echo 🎮 消消乐对战服务器启动脚本
echo ================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node -v
echo ✅ npm 已安装
npm -v
echo.

REM 进入服务器目录
cd server

REM 检查依赖是否已安装
if not exist "node_modules\" (
    echo 📦 正在安装依赖...
    call npm install
    echo.
)

REM 启动服务器
echo 🚀 启动服务器...
echo.
call npm start

pause
