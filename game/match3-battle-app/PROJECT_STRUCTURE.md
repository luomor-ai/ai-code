# 📁 项目结构

```
match3-battle-app/
│
├── 📄 README.md                 # 项目主文档
├── 📄 QUICKSTART.md            # 快速开始指南
├── 📄 API.md                   # WebSocket API 文档
├── 📄 .gitignore               # Git 忽略文件配置
│
├── 🚀 start.sh                 # Linux/Mac 启动脚本
├── 🚀 start.bat                # Windows 启动脚本
│
├── 📂 server/                  # 服务端代码
│   ├── server.js              # WebSocket 服务器主文件
│   └── package.json           # 服务端依赖配置
│
└── 📂 client/                  # 客户端代码
    ├── index.html             # 游戏主页面
    └── game.js                # 游戏逻辑和 WebSocket 客户端
```

## 📝 文件说明

### 根目录文件

#### README.md
- 项目完整介绍
- 功能特性列表
- 安装和部署指南
- 技术架构说明
- 开发计划

#### QUICKSTART.md
- 快速启动指南
- 常见问题解答
- 多种启动方式
- 移动端测试说明

#### API.md
- WebSocket 消息协议
- 完整 API 参考
- 数据结构定义
- 错误处理说明
- 开发调试建议

#### start.sh / start.bat
- 一键启动脚本
- 自动安装依赖
- 环境检测
- 跨平台支持

### server/ 目录

#### server.js (核心服务端代码)
**主要功能模块：**

1. **WebSocket 服务器**
   - Express HTTP 服务器
   - WebSocket 服务器配置
   - 静态文件服务

2. **房间管理系统**
   - `Room` 类 - 房间数据结构
   - `rooms` Map - 房间存储
   - 房间创建、加入、离开逻辑

3. **玩家管理系统**
   - `Player` 类 - 玩家数据结构
   - `players` Map - 玩家连接映射
   - 玩家连接、断开处理

4. **匹配系统**
   - `matchmaking` 队列 - 匹配队列
   - 快速匹配算法
   - 自动配对逻辑

5. **游戏逻辑**
   - 游戏开始处理
   - 分数同步
   - 计时管理
   - 游戏结束判定

6. **消息路由**
   - `handleMessage()` - 消息分发
   - 各类型消息处理函数
   - 广播机制

7. **定时任务**
   - 游戏计时器
   - 房间清理任务

**代码结构：**
```javascript
// 配置和初始化
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 数据结构
class Room { ... }
class Player { ... }

// 存储
const rooms = new Map();
const players = new Map();
const matchmaking = [];

// 工具函数
function generateRoomCode() { ... }

// WebSocket 事件处理
wss.on('connection', (ws) => { ... });

// 消息处理
function handleMessage(ws, data) { ... }
function handleQuickMatch(player) { ... }
function handleCreateRoom(player) { ... }
// ... 其他处理函数

// 服务器启动
server.listen(PORT, () => { ... });

// 定时任务
setInterval(() => { ... }, 60000);
```

#### package.json
**依赖说明：**
- `express` - HTTP 服务器框架
- `ws` - WebSocket 库
- `uuid` - 生成唯一 ID

**脚本命令：**
- `npm start` - 启动服务器
- `npm run dev` - 开发模式（自动重启）

### client/ 目录

#### index.html (游戏界面)
**页面结构：**

1. **连接状态指示器**
   - 实时显示 WebSocket 连接状态
   - 绿色：已连接
   - 红色：未连接

2. **主页面 (homeScreen)**
   - Logo 和标题
   - 快速匹配按钮
   - 创建房间按钮
   - 加入房间按钮

3. **房间页面 (roomScreen)**
   - 房间号显示
   - 复制房间号按钮
   - 玩家槽位（自己 + 对手）
   - 开始游戏按钮

4. **游戏页面 (gameScreen)**
   - 分数对比显示
   - 倒计时进度条
   - 8x8 游戏网格
   - 聊天容器
   - 表情选择器

5. **结果页面 (resultScreen)**
   - 胜负图标和标题
   - 分数对比
   - 返回主页按钮
   - 再来一局按钮

6. **加入房间模态框**
   - 房间号输入框
   - 确认/取消按钮

7. **Toast 提示框**
   - 全局消息提示

**样式特点：**
- 移动端优化
- 渐变色设计
- 流畅动画
- 触摸友好

#### game.js (游戏逻辑)
**主要功能模块：**

1. **游戏状态管理**
```javascript
let gameState = {
  playerId: null,
  playerName: '',
  roomCode: '',
  isHost: false,
  opponentConnected: false,
  myScore: 0,
  opponentScore: 0,
  grid: [],
  selectedCell: null,
  gameTimer: null
};
```

2. **WebSocket 通信**
   - `connectWebSocket()` - 建立连接
   - `sendToServer()` - 发送消息
   - `handleServerMessage()` - 处理消息
   - 断线重连机制

3. **UI 交互**
   - `showScreen()` - 页面切换
   - `showToast()` - 提示信息
   - `updateConnectionStatus()` - 更新连接状态

4. **房间功能**
   - `quickMatch()` - 快速匹配
   - `showCreateRoom()` - 创建房间
   - `joinRoom()` - 加入房间
   - `leaveRoom()` - 离开房间
   - `copyRoomCode()` - 复制房间号

5. **游戏核心逻辑**
   - `initializeGrid()` - 初始化网格
   - `selectCell()` - 选择方块
   - `swapCells()` - 交换方块
   - `findMatches()` - 查找匹配
   - `removeMatches()` - 移除匹配
   - `dropCells()` - 方块下落
   - `updateGrid()` - 更新显示

6. **计时系统**
   - `startTimer()` - 开始计时
   - 进度条动画
   - 游戏结束触发

7. **聊天功能**
   - `sendMessage()` - 发送消息
   - `addChatMessage()` - 添加消息
   - `toggleEmojiPicker()` - 表情选择
   - `insertEmoji()` - 插入表情

**核心算法：**

##### 三消匹配算法
```javascript
function findMatches() {
  // 横向检查 3 连
  // 纵向检查 3 连
  // 去重返回
}
```

##### 方块下落算法
```javascript
function dropCells() {
  // 1. 计算每列空位
  // 2. 下落现有方块
  // 3. 生成新方块填充
  // 4. 递归检查新匹配
}
```

##### 初始化避免匹配
```javascript
function wouldCreateMatch(row, col, color) {
  // 检查放置后是否立即形成 3 连
  // 确保初始网格无匹配
}
```

## 🔄 消息流程图

### 创建房间流程
```
客户端 → createRoom
  ↓
服务器创建房间
  ↓
服务器 → roomCreated
  ↓
客户端显示房间页面
  ↓
等待对手...
  ↓
对手加入 → playerJoined
  ↓
房主开始游戏 → startGame
  ↓
服务器 → gameStarted (广播)
  ↓
双方进入游戏页面
```

### 游戏进行流程
```
玩家操作消除方块
  ↓
客户端计算分数
  ↓
客户端 → updateScore
  ↓
服务器 → scoreUpdate (发给对手)
  ↓
对手客户端更新对手分数显示
  ↓
60秒后
  ↓
服务器 → gameEnded (广播)
  ↓
双方显示结果页面
```

### 聊天消息流程
```
玩家输入消息
  ↓
客户端 → chat
  ↓
客户端立即显示自己的消息
  ↓
服务器转发 → chat (发给对手)
  ↓
对手客户端显示消息
```

## 🎯 关键技术点

### 1. WebSocket 双向通信
- 实时性强
- 低延迟
- 支持双向推送

### 2. 状态同步
- 分数实时同步
- 房间状态同步
- 游戏进度同步

### 3. 房间管理
- 唯一房间号生成
- 房间生命周期管理
- 自动清理机制

### 4. 匹配算法
- 先进先出队列
- 自动配对
- 快速响应

### 5. 断线处理
- 客户端自动重连
- 服务器清理连接
- 友好提示

### 6. 游戏逻辑
- 三消算法
- 下落动画
- 连锁反应
- 避免初始匹配

## 📊 数据流向

```
浏览器 ←→ WebSocket ←→ 服务器
  ↓                      ↓
UI 更新              房间管理
游戏逻辑             玩家管理
聊天显示             消息广播
                     定时任务
```

## 🔧 扩展建议

### 新增功能模块位置

1. **排行榜系统**
   - 服务器: 添加数据库存储
   - 客户端: 新增排行榜页面

2. **好友系统**
   - 服务器: 添加用户认证
   - 客户端: 新增好友列表

3. **道具系统**
   - 服务器: 同步道具使用
   - 客户端: 道具 UI 和效果

4. **回放功能**
   - 服务器: 记录游戏操作
   - 客户端: 回放播放器

5. **观战模式**
   - 服务器: 广播游戏状态
   - 客户端: 观战视图

## 💡 开发提示

### 添加新的消息类型
1. 在 `server.js` 的 `handleMessage` 添加处理函数
2. 在 `game.js` 的 `handleServerMessage` 添加接收处理
3. 更新 `API.md` 文档

### 修改游戏参数
- 游戏时长: `server.js` 中 `duration: 60000`
- 网格大小: `game.js` 中 `initializeGrid()` 循环
- 方块颜色: CSS 中 `.color-N` 类

### 调试技巧
- 打开浏览器控制台查看 WebSocket 消息
- 服务器添加 `console.log` 查看状态
- 使用两个浏览器标签测试对战

---

**项目完整，开箱即用！** 🎉
