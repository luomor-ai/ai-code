#!/bin/bash

echo "=========================================="
echo "   多人消消乐对战 - 快速启动指南"
echo "=========================================="
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null
then
    echo "❌ 错误: 未检测到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"
echo ""

# 检查 npm 是否安装
if ! command -v npm &> /dev/null
then
    echo "❌ 错误: 未检测到 npm"
    exit 1
fi

echo "✅ npm 版本: $(npm -v)"
echo ""

# 安装依赖
echo "📦 正在安装依赖..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

echo ""
echo "=========================================="
echo "   🎮 准备启动服务器"
echo "=========================================="
echo ""
echo "服务器将在以下地址运行:"
echo "  WebSocket: ws://localhost:8080"
echo "  HTTP:      http://localhost:8080"
echo ""
echo "按 Ctrl+C 可停止服务器"
echo ""
echo "=========================================="
echo ""

# 启动服务器
npm start
