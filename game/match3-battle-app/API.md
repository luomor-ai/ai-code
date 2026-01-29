# 📡 WebSocket API 文档

## 连接

**WebSocket URL:** `ws://localhost:3000` 或 `wss://your-domain.com`

## 消息格式

所有消息使用 JSON 格式：
```json
{
  "type": "消息类型",
  "data": "消息数据"
}
```

---

## 客户端 → 服务器消息

### 1. 快速匹配
```json
{
  "type": "quickMatch"
}
```
**描述**: 请求快速匹配对手

**响应**:
- `matching` - 进入匹配队列
- `roomCreated` - 匹配成功，创建房间
- `roomJoined` - 匹配成功，加入房间

---

### 2. 创建房间
```json
{
  "type": "createRoom"
}
```
**描述**: 创建新游戏房间

**响应**:
```json
{
  "type": "roomCreated",
  "roomCode": "ABCD",
  "isHost": true
}
```

---

### 3. 加入房间
```json
{
  "type": "joinRoom",
  "roomCode": "ABCD"
}
```
**描述**: 通过房间号加入房间

**参数**:
- `roomCode` (string): 4位房间号

**响应**:
- 成功: `roomJoined`
- 失败: `error` (房间不存在/已满/游戏已开始)

---

### 4. 离开房间
```json
{
  "type": "leaveRoom"
}
```
**描述**: 离开当前房间

**响应**: 无（服务器会通知房间内其他玩家）

---

### 5. 开始游戏
```json
{
  "type": "startGame"
}
```
**描述**: 房主开始游戏（需要双方都在房间内）

**响应**:
```json
{
  "type": "gameStarted",
  "startTime": 1234567890,
  "duration": 60000
}
```

**错误响应**:
- 非房主操作: `error` - "只有房主可以开始游戏"
- 对手未加入: `error` - "等待对手加入"

---

### 6. 更新分数
```json
{
  "type": "updateScore",
  "score": 150
}
```
**描述**: 向服务器同步当前分数

**参数**:
- `score` (number): 当前玩家分数

**响应**: 无（服务器会广播给对手）

---

### 7. 游戏动作
```json
{
  "type": "gameAction",
  "action": {
    "type": "swap",
    "from": [0, 0],
    "to": [0, 1]
  }
}
```
**描述**: 同步游戏操作（可选，用于观战等功能）

**参数**:
- `action` (object): 游戏动作数据

---

### 8. 聊天消息
```json
{
  "type": "chat",
  "message": "你好！"
}
```
**描述**: 发送聊天消息

**参数**:
- `message` (string): 消息内容（最大100字符）

**响应**:
```json
{
  "type": "chatSent",
  "message": "你好！"
}
```

---

## 服务器 → 客户端消息

### 1. 连接成功
```json
{
  "type": "connected",
  "playerId": "uuid-string",
  "playerName": "玩家1234"
}
```
**描述**: 连接建立后立即发送

---

### 2. 匹配中
```json
{
  "type": "matching",
  "message": "正在匹配对手..."
}
```
**描述**: 快速匹配时，进入匹配队列

---

### 3. 房间已创建
```json
{
  "type": "roomCreated",
  "roomCode": "ABCD",
  "isHost": true
}
```
**描述**: 房间创建成功

---

### 4. 已加入房间
```json
{
  "type": "roomJoined",
  "roomCode": "ABCD",
  "isHost": false
}
```
**描述**: 成功加入房间

---

### 5. 玩家加入
```json
{
  "type": "playerJoined",
  "opponentName": "玩家5678"
}
```
**描述**: 有新玩家加入房间

---

### 6. 玩家离开
```json
{
  "type": "playerLeft",
  "message": "对手已离开房间"
}
```
**描述**: 房间内玩家离开

---

### 7. 游戏开始
```json
{
  "type": "gameStarted",
  "startTime": 1234567890,
  "duration": 60000
}
```
**描述**: 游戏开始（双方同时收到）

**参数**:
- `startTime` (number): 游戏开始时间戳（毫秒）
- `duration` (number): 游戏时长（毫秒）

---

### 8. 分数更新
```json
{
  "type": "scoreUpdate",
  "opponentScore": 200
}
```
**描述**: 对手分数更新

---

### 9. 游戏动作广播
```json
{
  "type": "gameAction",
  "action": {
    "type": "swap",
    "from": [0, 0],
    "to": [0, 1]
  }
}
```
**描述**: 对手的游戏动作

---

### 10. 游戏结束
```json
{
  "type": "gameEnded",
  "scores": [
    {
      "playerId": "uuid-1",
      "name": "玩家1234",
      "score": 250
    },
    {
      "playerId": "uuid-2",
      "name": "玩家5678",
      "score": 180
    }
  ],
  "winner": {
    "playerId": "uuid-1",
    "name": "玩家1234",
    "score": 250
  }
}
```
**描述**: 游戏时间到，公布结果

---

### 11. 聊天消息
```json
{
  "type": "chat",
  "sender": "玩家5678",
  "message": "你好！",
  "isOwn": false
}
```
**描述**: 收到聊天消息

---

### 12. 错误消息
```json
{
  "type": "error",
  "message": "房间不存在"
}
```
**描述**: 操作失败或异常

**常见错误**:
- "房间不存在"
- "房间已满"
- "游戏已开始"
- "只有房主可以开始游戏"
- "等待对手加入"

---

## 数据结构

### Room (房间)
```javascript
{
  roomCode: string,        // 房间号 (4位)
  host: Player,            // 房主
  players: [Player],       // 玩家列表 (最多2人)
  gameState: {
    started: boolean,      // 是否已开始
    startTime: number,     // 开始时间戳
    duration: number,      // 游戏时长 (毫秒)
    scores: {}            // 分数记录
  }
}
```

### Player (玩家)
```javascript
{
  playerId: string,        // 玩家ID (UUID)
  name: string,           // 玩家名称
  roomCode: string,       // 所在房间号
  score: number,          // 当前分数
  ws: WebSocket          // WebSocket连接
}
```

---

## 连接生命周期

```
1. 客户端连接 → 服务器发送 'connected'
2. 客户端请求操作 (创建/加入房间)
3. 房间操作完成
4. 等待对手
5. 开始游戏 → 服务器发送 'gameStarted'
6. 游戏进行中 (分数同步、聊天)
7. 60秒后 → 服务器发送 'gameEnded'
8. 查看结果
9. 返回主页或再来一局
```

---

## 错误处理

### 客户端断线
- 服务器自动从房间移除
- 通知房间内其他玩家
- 游戏中断线视为认输

### 服务器重启
- 客户端自动尝试重连
- 所有房间数据清空
- 玩家需要重新创建/加入房间

---

## 安全建议

1. **输入验证**: 服务器应验证所有输入参数
2. **速率限制**: 限制消息发送频率，防止刷屏
3. **房间限制**: 限制单个玩家创建的房间数量
4. **超时处理**: 长时间无操作自动断开连接
5. **消息长度**: 限制聊天消息长度（建议100字符）

---

## 性能优化

1. **心跳检测**: 定期发送 ping/pong 保持连接
2. **消息压缩**: 使用 WebSocket 压缩扩展
3. **批量发送**: 合并多个小消息
4. **状态缓存**: 缓存房间状态，减少计算
5. **连接池**: 使用连接池管理 WebSocket

---

## 开发工具

### WebSocket 测试工具
- Chrome DevTools (Network → WS)
- Postman
- websocat (命令行工具)

### 调试建议
```javascript
// 客户端日志
ws.addEventListener('message', (event) => {
  console.log('收到消息:', JSON.parse(event.data));
});

// 服务器日志
console.log('房间状态:', {
  总房间数: rooms.size,
  总玩家数: players.size,
  匹配队列: matchmaking.length
});
```

---

## 版本历史

### v1.0.0 (当前版本)
- ✅ 基础 WebSocket 通信
- ✅ 房间系统
- ✅ 快速匹配
- ✅ 实时分数同步
- ✅ 聊天功能

### 未来计划
- 🔜 心跳检测
- 🔜 断线重连恢复游戏状态
- 🔜 观战模式
- 🔜 回放功能
- 🔜 排行榜

---

**有问题？** 查看 [README.md](README.md) 或提交 Issue
