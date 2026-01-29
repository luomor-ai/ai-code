const WebSocket = require('ws');
const http = require('http');

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Match-3 Game WebSocket Server Running\n');
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ server });

// 游戏房间存储
const rooms = new Map();
// 等待匹配的玩家队列
const matchQueue = [];

// 生成房间号
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 房间类
class GameRoom {
  constructor(roomCode, host) {
    this.roomCode = roomCode;
    this.host = host;
    this.guest = null;
    this.hostScore = 0;
    this.guestScore = 0;
    this.gameStarted = false;
  }

  isFull() {
    return this.guest !== null;
  }

  addGuest(guest) {
    this.guest = guest;
  }

  startGame() {
    this.gameStarted = true;
  }

  broadcast(data, excludePlayer = null) {
    const message = JSON.stringify(data);
    
    if (this.host && this.host !== excludePlayer && this.host.readyState === WebSocket.OPEN) {
      this.host.send(message);
    }
    
    if (this.guest && this.guest !== excludePlayer && this.guest.readyState === WebSocket.OPEN) {
      this.guest.send(message);
    }
  }

  getOpponentName(player) {
    if (player === this.host) {
      return this.guest.playerName;
    } else {
      return this.host.playerName;
    }
  }

  removePlayer(ws) {
    if (ws === this.host) {
      this.host = null;
    } else if (ws === this.guest) {
      this.guest = null;
    }
  }

  isEmpty() {
    return !this.host && !this.guest;
  }
}

// WebSocket 连接处理
wss.on('connection', (ws) => {
  console.log('新客户端连接');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (error) {
      console.error('解析消息错误:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: '无效的消息格式'
      }));
    }
  });

  ws.on('close', () => {
    console.log('客户端断开连接');
    handleDisconnect(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
  });
});

// 处理消息
function handleMessage(ws, data) {
  switch (data.type) {
    case 'create-room':
      handleCreateRoom(ws, data);
      break;
    
    case 'join-room':
      handleJoinRoom(ws, data);
      break;
    
    case 'random-match':
      handleRandomMatch(ws, data);
      break;
    
    case 'score-update':
      handleScoreUpdate(ws, data);
      break;
    
    case 'chat-message':
      handleChatMessage(ws, data);
      break;
    
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: '未知的消息类型'
      }));
  }
}

// 创建房间
function handleCreateRoom(ws, data) {
  const roomCode = generateRoomCode();
  const room = new GameRoom(roomCode, ws);
  
  ws.playerName = data.playerName;
  ws.roomCode = roomCode;
  ws.role = 'host';
  
  rooms.set(roomCode, room);
  
  ws.send(JSON.stringify({
    type: 'room-created',
    roomCode: roomCode
  }));
  
  console.log(`房间创建成功: ${roomCode}, 主机: ${data.playerName}`);
}

// 加入房间
function handleJoinRoom(ws, data) {
  const roomCode = data.roomCode.toUpperCase();
  const room = rooms.get(roomCode);
  
  if (!room) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '房间不存在'
    }));
    return;
  }
  
  if (room.isFull()) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '房间已满'
    }));
    return;
  }
  
  ws.playerName = data.playerName;
  ws.roomCode = roomCode;
  ws.role = 'guest';
  
  room.addGuest(ws);
  
  // 通知客人加入成功
  ws.send(JSON.stringify({
    type: 'room-joined',
    opponentName: room.host.playerName
  }));
  
  // 通知主机有人加入，开始游戏
  room.broadcast({
    type: 'game-start',
    opponentName: data.playerName
  }, ws);
  
  // 也通知客人游戏开始
  ws.send(JSON.stringify({
    type: 'game-start',
    opponentName: room.host.playerName
  }));
  
  room.startGame();
  
  console.log(`${data.playerName} 加入房间: ${roomCode}`);
}

// 随机匹配
function handleRandomMatch(ws, data) {
  ws.playerName = data.playerName;
  
  // 检查是否有等待的玩家
  if (matchQueue.length > 0) {
    const opponent = matchQueue.shift();
    
    // 创建新房间
    const roomCode = generateRoomCode();
    const room = new GameRoom(roomCode, opponent);
    
    opponent.roomCode = roomCode;
    opponent.role = 'host';
    ws.roomCode = roomCode;
    ws.role = 'guest';
    
    room.addGuest(ws);
    rooms.set(roomCode, room);
    
    // 通知双方游戏开始
    opponent.send(JSON.stringify({
      type: 'game-start',
      opponentName: data.playerName
    }));
    
    ws.send(JSON.stringify({
      type: 'game-start',
      opponentName: opponent.playerName
    }));
    
    room.startGame();
    
    console.log(`随机匹配成功: ${opponent.playerName} vs ${data.playerName}`);
  } else {
    // 加入匹配队列
    matchQueue.push(ws);
    console.log(`${data.playerName} 加入匹配队列`);
  }
}

// 更新分数
function handleScoreUpdate(ws, data) {
  const roomCode = ws.roomCode;
  const room = rooms.get(roomCode);
  
  if (!room) return;
  
  // 更新分数
  if (ws === room.host) {
    room.hostScore = data.score;
  } else if (ws === room.guest) {
    room.guestScore = data.score;
  }
  
  // 广播分数给对手
  room.broadcast({
    type: 'score-update',
    score: data.score
  }, ws);
}

// 处理聊天消息
function handleChatMessage(ws, data) {
  const roomCode = ws.roomCode;
  const room = rooms.get(roomCode);
  
  if (!room) return;
  
  // 广播消息给对手
  room.broadcast({
    type: 'chat-message',
    sender: ws.playerName,
    message: data.message,
    isEmoji: data.isEmoji
  }, ws);
}

// 处理断开连接
function handleDisconnect(ws) {
  const roomCode = ws.roomCode;
  
  // 从匹配队列中移除
  const queueIndex = matchQueue.indexOf(ws);
  if (queueIndex !== -1) {
    matchQueue.splice(queueIndex, 1);
    console.log(`${ws.playerName} 离开匹配队列`);
    return;
  }
  
  // 从房间中移除
  if (roomCode) {
    const room = rooms.get(roomCode);
    if (room) {
      // 通知对手
      room.broadcast({
        type: 'opponent-left'
      }, ws);
      
      room.removePlayer(ws);
      
      // 如果房间为空，删除房间
      if (room.isEmpty()) {
        rooms.delete(roomCode);
        console.log(`房间 ${roomCode} 已删除`);
      }
    }
  }
}

// 启动服务器
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🎮 Match-3 游戏服务器已启动`);
  console.log(`📡 WebSocket 地址: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP 地址: http://localhost:${PORT}`);
  console.log(`========================================\n`);
});

// 定期清理空房间和断开的连接
setInterval(() => {
  // 清理断开连接的匹配队列
  for (let i = matchQueue.length - 1; i >= 0; i--) {
    if (matchQueue[i].readyState !== WebSocket.OPEN) {
      matchQueue.splice(i, 1);
    }
  }
  
  // 清理空房间
  for (const [roomCode, room] of rooms.entries()) {
    if (room.isEmpty() || 
        (room.host && room.host.readyState !== WebSocket.OPEN && 
         room.guest && room.guest.readyState !== WebSocket.OPEN)) {
      rooms.delete(roomCode);
      console.log(`清理空房间: ${roomCode}`);
    }
  }
}, 30000); // 每30秒清理一次

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
