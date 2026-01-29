# 多人实时对战消消乐游戏

一个功能完整的多人实时对战消消乐（Match-3）游戏，支持房间系统、随机匹配和实时聊天。

## 🎮 核心功能

### 1. 标准三消玩法
- ✅ 8x8 游戏棋盘
- ✅ 6 种颜色方块（🔴🟡🟢🔵🟣🟠）
- ✅ 点击交换相邻方块
- ✅ 自动检测 3 个或以上连续方块
- ✅ 消除后自动掉落填充
- ✅ 连击系统（Combo）加分

### 2. 联机对战系统
- ✅ 1v1 实时对战
- ✅ 通过 WebSocket 实时同步分数
- ✅ 2 分钟倒计时对战
- ✅ 实时显示双方分数

### 3. 房间系统
- ✅ **创建房间**：生成 4 位房间号，邀请好友
- ✅ **加入房间**：输入房间号加入对战
- ✅ **随机匹配**：快速匹配在线玩家

### 4. 即时通讯
- ✅ 房间内文字聊天
- ✅ 8 种快捷表情包（😀😎🎉🔥💪👍❤️🎮）
- ✅ 实时消息同步
- ✅ 浮动聊天窗口

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动后端服务器

```bash
npm start
```

服务器将在 `ws://localhost:8080` 启动

### 运行前端

1. 将 `match3-game.jsx` 作为 React 组件导入到你的项目中
2. 或者直接在 Claude.ai 中将其作为 Artifact 运行

## 📁 项目结构

```
match3-multiplayer-game/
├── server.js              # WebSocket 后端服务器
├── match3-game.jsx        # React 前端游戏组件
├── package.json           # 项目配置
└── README.md             # 说明文档
```

## 🎯 游戏规则

1. **开始游戏**
   - 输入玩家名称
   - 选择创建房间、加入房间或随机匹配

2. **游戏玩法**
   - 点击方块选中
   - 再点击相邻方块进行交换
   - 形成 3 个或以上同色方块即可消除
   - 连续消除可获得 Combo 加分

3. **计分系统**
   - 每消除一个方块：10 分
   - Combo 加成：分数 × (连击数 + 1)

4. **胜负判定**
   - 2 分钟倒计时结束
   - 分数高者获胜

## 🔧 技术栈

### 前端
- **React** - UI 框架
- **Lucide React** - 图标库
- **WebSocket Client** - 实时通信

### 后端
- **Node.js** - 运行环境
- **ws** - WebSocket 库
- **HTTP Server** - 基础服务器

## 🎨 设计特色

- **渐变紫色主题**：现代感十足的紫色渐变背景
- **流畅动画**：方块交换、消除、掉落动画
- **响应式设计**：适配桌面和移动端
- **直观界面**：清晰的分数显示和计时器
- **视觉反馈**：连击提示、选中高亮

## 🌐 WebSocket 通信协议

### 客户端 → 服务器

```javascript
// 创建房间
{ type: 'create-room', playerName: '玩家名' }

// 加入房间
{ type: 'join-room', roomCode: 'ABCD', playerName: '玩家名' }

// 随机匹配
{ type: 'random-match', playerName: '玩家名' }

// 更新分数
{ type: 'score-update', score: 1000 }

// 发送聊天
{ type: 'chat-message', message: '你好', isEmoji: false }
```

### 服务器 → 客户端

```javascript
// 房间创建成功
{ type: 'room-created', roomCode: 'ABCD' }

// 加入房间成功
{ type: 'room-joined', opponentName: '对手名' }

// 游戏开始
{ type: 'game-start', opponentName: '对手名' }

// 分数更新
{ type: 'score-update', score: 1000 }

// 聊天消息
{ type: 'chat-message', sender: '发送者', message: '内容', isEmoji: false }

// 对手离开
{ type: 'opponent-left' }

// 错误消息
{ type: 'error', message: '错误信息' }
```

## 🔐 服务器特性

- ✅ 房间管理系统
- ✅ 玩家匹配队列
- ✅ 实时分数同步
- ✅ 聊天消息转发
- ✅ 自动清理空房间
- ✅ 断线重连处理
- ✅ 错误处理和验证

## 📱 支持的功能

- ✅ 多房间并发
- ✅ 无限玩家同时在线
- ✅ 自动匹配算法
- ✅ 房间号系统
- ✅ 实时聊天
- ✅ 表情快捷发送

## 🐛 已知问题

- 刷新页面会断开连接（需重新加入）
- 不支持观战模式
- 没有持久化存储（重启服务器会清空所有房间）

## 🚧 未来计划

- [ ] 添加排行榜系统
- [ ] 支持更多房间人数（2v2、自由模式）
- [ ] 添加道具系统
- [ ] 实现断线重连
- [ ] 添加观战模式
- [ ] 数据持久化
- [ ] 玩家等级系统
- [ ] 好友系统

## 📝 开发说明

### 修改服务器端口

在 `server.js` 中修改：

```javascript
const PORT = process.env.PORT || 8080;
```

### 修改游戏时长

在 `match3-game.jsx` 中修改：

```javascript
const GAME_TIME = 120; // 秒数
```

### 修改棋盘大小

在 `match3-game.jsx` 中修改：

```javascript
const BOARD_SIZE = 8; // 8x8 棋盘
```

### 添加更多颜色

在 `match3-game.jsx` 中修改：

```javascript
const COLORS = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠', '🟤']; // 添加更多
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**享受游戏！** 🎮✨
