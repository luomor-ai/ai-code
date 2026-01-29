# 🎮 消消乐对战 - 多人实时对战游戏

一个基于 WebSocket 的多人实时对战消消乐游戏，支持房间系统、快速匹配和即时通讯。

## ✨ 功能特性

### 核心功能
- ✅ **经典三消游戏** - 8x8 网格，交换消除，连锁反应
- ✅ **实时对战** - WebSocket 实时同步分数和游戏状态
- ✅ **房间系统** - 创建房间/加入房间/快速匹配
- ✅ **即时通讯** - 房间内文字聊天和表情包
- ✅ **60秒限时** - 紧张刺激的限时对战
- ✅ **断线重连** - 自动重连机制

### 技术特性
- 🚀 WebSocket 双向通信
- 📱 移动端优化，适配触摸操作
- 🎨 精美渐变色 UI 设计
- ⚡ 流畅动画效果
- 🔄 自动房间清理和匹配队列管理

## 📦 项目结构

```
match3-battle-app/
├── server/                 # 服务端
│   ├── server.js          # WebSocket 服务器主文件
│   └── package.json       # 服务端依赖配置
│
└── client/                # 客户端
    ├── index.html         # 主页面
    └── game.js            # 游戏逻辑和 WebSocket 客户端
```

## 🚀 快速开始

### 环境要求
- Node.js 14.0 或更高版本
- npm 或 yarn

### 安装步骤

1. **克隆或下载项目**
```bash
cd match3-battle-app
```

2. **安装服务端依赖**
```bash
cd server
npm install
```

3. **启动服务器**
```bash
npm start
```

或者使用开发模式（自动重启）：
```bash
npm run dev
```

4. **访问游戏**

在浏览器中打开：
```
http://localhost:3000
```

## 🎯 游戏玩法

### 基础规则
1. 点击相邻的方块进行交换
2. 形成 3 个或以上相同颜色的横向或纵向连线即可消除
3. 消除后上方方块会下落填充空位
4. 每消除一个方块得 10 分
5. 60 秒内获得最高分的玩家获胜

### 游戏模式

#### 🎲 快速匹配
- 系统自动为你匹配一个对手
- 匹配成功后自动创建房间

#### ➕ 创建房间
- 创建一个新房间并生成 4 位房间号
- 分享房间号给好友加入
- 房主可以开始游戏

#### 🔍 加入房间
- 输入 4 位房间号
- 加入好友创建的房间

## 🔧 技术架构

### 服务端 (Node.js + WebSocket)

**主要功能：**
- WebSocket 连接管理
- 房间创建和管理
- 快速匹配队列
- 游戏状态同步
- 聊天消息转发
- 定时任务（游戏计时、房间清理）

**核心模块：**
- `express` - HTTP 服务器
- `ws` - WebSocket 服务器
- `uuid` - 生成唯一玩家 ID

### 客户端 (HTML5 + JavaScript)

**主要功能：**
- WebSocket 客户端连接
- 游戏逻辑（三消算法）
- UI 交互和动画
- 实时聊天
- 自动重连

**消息类型：**

#### 客户端 → 服务器
- `quickMatch` - 快速匹配
- `createRoom` - 创建房间
- `joinRoom` - 加入房间
- `leaveRoom` - 离开房间
- `startGame` - 开始游戏
- `updateScore` - 更新分数
- `chat` - 发送聊天消息

#### 服务器 → 客户端
- `connected` - 连接成功
- `roomCreated` - 房间已创建
- `roomJoined` - 已加入房间
- `playerJoined` - 玩家加入
- `playerLeft` - 玩家离开
- `gameStarted` - 游戏开始
- `scoreUpdate` - 分数更新
- `gameEnded` - 游戏结束
- `chat` - 聊天消息
- `error` - 错误消息

## 🎨 UI/UX 设计

### 配色方案
- **主题渐变**: 紫色渐变 (#667eea → #764ba2)
- **游戏方块**: 6 种鲜艳颜色
  - 红色 (#FF6B6B)
  - 青色 (#4ECDC4)
  - 黄色 (#FFE66D)
  - 薄荷绿 (#95E1D3)
  - 浅绿 (#A8E6CF)
  - 粉色 (#FF8B94)

### 页面流程
1. **主页** → 选择游戏模式
2. **房间页** → 等待对手/显示房间信息
3. **游戏页** → 对战界面 + 实时聊天
4. **结果页** → 显示胜负和分数

## 🔐 服务器配置

### 端口配置
默认端口为 `3000`，可以通过环境变量修改：

```bash
PORT=8080 npm start
```

### 生产环境部署

1. **使用 PM2 部署**
```bash
npm install -g pm2
pm2 start server.js --name "match3-battle"
pm2 save
```

2. **使用 Nginx 反向代理**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

3. **HTTPS 支持**
修改 `server.js` 添加 HTTPS：
```javascript
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('private-key.pem'),
    cert: fs.readFileSync('certificate.pem')
};

const server = https.createServer(options, app);
```

## 🐛 故障排除

### WebSocket 连接失败
- 检查防火墙是否开放端口
- 确认服务器正常运行
- 查看浏览器控制台错误信息

### 游戏卡顿
- 检查网络连接
- 降低浏览器缩放比例
- 清除浏览器缓存

### 房间无法加入
- 确认房间号正确（4 位大写字母或数字）
- 检查房间是否已满（最多 2 人）
- 确认游戏未开始

## 📝 开发计划

### 即将实现
- [ ] 排行榜系统
- [ ] 好友系统
- [ ] 更多游戏模式（闯关模式、生存模式）
- [ ] 道具系统
- [ ] 皮肤/主题切换
- [ ] 观战功能
- [ ] 回放系统

### 性能优化
- [ ] Redis 存储房间数据
- [ ] 数据库持久化（用户数据、战绩）
- [ ] WebSocket 连接池
- [ ] CDN 加速

## 📄 License

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至项目维护者

---

**祝游戏愉快！🎉**
