# 🎮 消消乐对战 - 完整项目说明

## 📦 项目包含内容

本项目包含**两个完整的应用**，可以独立运行：

### 1. Web 版本（match3-battle-app）
基于 Node.js + WebSocket 的 Web 应用
- ✅ 前端：原生 HTML/CSS/JavaScript
- ✅ 后端：Node.js + Express + WebSocket
- ✅ 部署：可部署到任何支持 Node.js 的服务器
- 📱 访问：通过浏览器访问（支持手机浏览器）

### 2. Android 原生 App（match3-android-app）
基于 React Native 的 Android 原生应用
- ✅ 框架：React Native 0.72
- ✅ 导航：React Navigation
- ✅ 通信：WebSocket 实时连接
- 📱 平台：Android 5.0+ (API Level 21+)

---

## 🎯 功能对比

| 功能 | Web 版 | Android App |
|------|--------|-------------|
| 三消游戏逻辑 | ✅ | ✅ |
| 实时对战 | ✅ | ✅ |
| 房间系统 | ✅ | ✅ |
| 即时聊天 | ✅ | ✅ |
| 离线运行 | ❌ | ❌ (需联网) |
| 安装到手机 | 可添加到主屏幕 | ✅ APK 安装 |
| 原生体验 | 🌐 Web | 📱 原生 |
| 性能 | 好 | 优秀 |

---

## 🚀 快速开始

### 方案 A: 只运行 Web 版（最简单）

**适合**: 快速体验、演示、开发测试

```bash
# 1. 解压 match3-battle-app.zip
# 2. 进入目录
cd match3-battle-app/server

# 3. 安装并启动
npm install
npm start

# 4. 浏览器访问
http://localhost:3000
```

⏱️ **耗时**: 5 分钟

### 方案 B: 开发 Android App

**适合**: 需要原生 Android 应用

**前置要求**:
- Node.js
- JDK 11
- Android Studio

```bash
# 1. 解压 match3-android-app.zip
# 2. 进入目录
cd match3-android-app

# 3. 安装依赖
npm install

# 4. 配置服务器地址（见下文）
# 5. 连接手机或启动模拟器
# 6. 运行
npm run android
```

⏱️ **耗时**: 30 分钟（首次配置环境）

### 方案 C: 完整部署（Web + App）

**适合**: 生产环境、完整体验

1. **部署 Web 服务器**
   ```bash
   # 在服务器上运行
   cd match3-battle-app/server
   npm install
   npm start
   ```

2. **配置 Android App**
   - 修改 `src/context/WebSocketContext.js`
   - 将 `WS_URL` 改为服务器地址
   - 打包 APK（见 BUILD_APK_GUIDE.md）

3. **分发 APK**
   - 直接分享 APK 文件
   - 或上传到 Google Play

⏱️ **耗时**: 1-2 小时

---

## 📡 服务器配置说明

### Web 版服务器

**默认配置**: `http://localhost:3000`

**修改端口**:
编辑 `server/server.js` 第 258 行:
```javascript
const PORT = process.env.PORT || 3000; // 改为其他端口
```

**部署到云服务器**:
```bash
# 1. 上传代码到服务器
# 2. 安装依赖
npm install

# 3. 使用 PM2 守护进程
npm install -g pm2
pm2 start server.js --name match3-battle

# 4. 配置防火墙开放端口 3000
```

### Android App 服务器配置

编辑 `match3-android-app/src/context/WebSocketContext.js`:

```javascript
// 本地开发（电脑和手机同一WiFi）
const WS_URL = 'ws://192.168.1.100:3000';

// 生产环境（使用域名）
const WS_URL = 'wss://yourdomain.com';
```

💡 **如何找局域网 IP**:
- Windows: `ipconfig` 查看 IPv4 地址
- Mac/Linux: `ifconfig` 或 `ip addr`

---

## 🔐 安全提醒

### 开发环境
- ✅ 使用 `ws://` (非加密)
- ✅ 允许明文流量 (AndroidManifest.xml 已配置)

### 生产环境
- ⚠️ 必须使用 `wss://` (加密 WebSocket)
- ⚠️ 配置 SSL 证书 (Let's Encrypt)
- ⚠️ 配置防火墙规则
- ⚠️ 实施访问限制

---

## 📊 架构说明

```
┌─────────────────┐
│   Web 浏览器     │
│   或 Android App │
└────────┬────────┘
         │ WebSocket
         │
    ┌────▼─────┐
    │  服务器   │
    │ (Node.js)│
    └──────────┘
         │
    ┌────▼────┐
    │ 房间管理 │
    │ 玩家匹配 │
    │ 游戏状态 │
    └─────────┘
```

### 通信流程

1. **连接**: 客户端通过 WebSocket 连接到服务器
2. **认证**: 发送昵称等基本信息
3. **房间**: 创建/加入房间
4. **匹配**: 随机匹配或邀请好友
5. **游戏**: 实时同步游戏状态
6. **聊天**: 发送消息到房间
7. **结束**: 断开连接，清理资源

---

## 📱 多平台支持

### 当前支持
- ✅ Android (原生 App)
- ✅ Web (所有现代浏览器)
- ✅ 移动浏览器 (PWA 体验)

### 可扩展支持
- 📋 iOS (React Native 同时支持)
- 📋 桌面应用 (Electron)
- 📋 小程序 (微信/支付宝)

---

## 🎨 自定义和扩展

### 修改颜色主题

**Web 版**: 
编辑 `client/index.html` CSS 部分，修改渐变色

**Android App**:
编辑各个 Screen 文件的 `styles` 对象

### 添加新功能

**示例**: 添加道具系统

1. 服务器端添加道具逻辑
2. 客户端添加道具 UI
3. 通过 WebSocket 同步道具状态

### 修改游戏规则

编辑游戏逻辑文件:
- Web: `client/game.js`
- Android: `src/screens/GameScreen.js`

---

## 📈 性能优化建议

### 服务器端
- 使用 Redis 缓存房间状态
- 实现负载均衡
- 使用 Nginx 反向代理
- 启用 Gzip 压缩

### 客户端
- 减少 WebSocket 消息频率
- 使用节流/防抖
- 优化渲染性能
- 压缩资源文件

---

## 🐛 问题排查

### Web 版常见问题

**Q**: 无法连接到服务器
```bash
# 检查服务器是否运行
netstat -an | grep 3000

# 检查防火墙
# Windows: 控制面板 → Windows Defender 防火墙
# Linux: sudo ufw status
```

**Q**: 游戏卡顿
- 检查网络延迟
- 关闭其他占用带宽的程序
- 更换浏览器

### Android App 常见问题

**Q**: 编译失败
```bash
# 清理缓存
cd android
./gradlew clean
cd ..
npm run android
```

**Q**: 无法连接 WebSocket
- 确保手机和服务器在同一网络
- 检查 IP 地址是否正确
- Android 9+ 确保允许明文流量

---

## 📚 学习资源

### Web 开发
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Node.js 文档](https://nodejs.org/docs/)
- [Express 指南](https://expressjs.com/)

### Android 开发
- [React Native 官方文档](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Android 开发者指南](https://developer.android.com/)

---

## 🤝 贡献指南

欢迎提交 Pull Request！

**贡献流程**:
1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 发起 Pull Request

---

## 📄 许可证

MIT License - 自由使用和修改

---

## 📞 技术支持

- 📧 Email: 通过 GitHub Issues
- 💬 讨论: GitHub Discussions
- 🐛 Bug 报告: GitHub Issues

---

## 🎉 开始你的游戏之旅！

选择适合你的方案，开始开发吧！

**推荐新手路径**:
1. 先运行 Web 版熟悉功能 (5分钟)
2. 再尝试 Android 开发 (30分钟)
3. 最后部署到生产环境 (1小时)

**祝你开发愉快！** 🚀
