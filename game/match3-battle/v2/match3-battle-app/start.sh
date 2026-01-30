#!/bin/bash

echo "========================================="
echo "  多人实时对战消消乐 App 启动脚本"
echo "========================================="
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null
then
    echo "❌ 未检测到 Node.js，请先安装 Node.js"
    echo "   下载地址: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js 版本: $(node --version)"
echo "✓ npm 版本: $(npm --version)"
echo ""

# 进入服务器目录
cd server

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

echo "🚀 正在启动服务器..."
echo ""
echo "========================================="
echo "  服务器地址: http://localhost:3000"
echo "  按 Ctrl+C 停止服务器"
echo "========================================="
echo ""

# 启动服务器
npm start
