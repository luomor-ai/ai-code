const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client')));

// 游戏房间管理
const rooms = new Map(); // roomCode -> Room
const players = new Map(); // ws -> Player
const matchmaking = []; // 等待匹配的玩家队列

// 房间数据结构
class Room {
    constructor(roomCode, host) {
        this.roomCode = roomCode;
        this.host = host;
        this.players = [host];
        this.gameState = {
            started: false,
            startTime: null,
            duration: 60000, // 60秒
            scores: {}
        };
    }

    addPlayer(player) {
        if (this.players.length < 2) {
            this.players.push(player);
            return true;
        }
        return false;
    }

    removePlayer(player) {
        this.players = this.players.filter(p => p !== player);
        return this.players.length === 0;
    }

    broadcast(message, excludePlayer = null) {
        this.players.forEach(player => {
            if (player !== excludePlayer && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(JSON.stringify(message));
            }
        });
    }

    isFull() {
        return this.players.length === 2;
    }

    getOpponent(player) {
        return this.players.find(p => p !== player);
    }
}

// 玩家数据结构
class Player {
    constructor(ws, playerId) {
        this.ws = ws;
        this.playerId = playerId;
        this.roomCode = null;
        this.name = `玩家${Math.floor(Math.random() * 10000)}`;
        this.score = 0;
    }
}

// 生成房间号
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    do {
        code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (rooms.has(code));
    return code;
}

// WebSocket 连接处理
wss.on('connection', (ws) => {
    const playerId = uuidv4();
    const player = new Player(ws, playerId);
    players.set(ws, player);

    console.log(`玩家连接: ${playerId}`);

    // 发送连接成功消息
    ws.send(JSON.stringify({
        type: 'connected',
        playerId: playerId,
        playerName: player.name
    }));

    // 消息处理
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('消息解析错误:', error);
        }
    });

    // 断开连接处理
    ws.on('close', () => {
        handleDisconnect(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket错误:', error);
    });
});

// 处理消息
function handleMessage(ws, data) {
    const player = players.get(ws);
    if (!player) return;

    switch (data.type) {
        case 'quickMatch':
            handleQuickMatch(player);
            break;

        case 'createRoom':
            handleCreateRoom(player);
            break;

        case 'joinRoom':
            handleJoinRoom(player, data.roomCode);
            break;

        case 'leaveRoom':
            handleLeaveRoom(player);
            break;

        case 'startGame':
            handleStartGame(player);
            break;

        case 'updateScore':
            handleUpdateScore(player, data.score);
            break;

        case 'gameAction':
            handleGameAction(player, data.action);
            break;

        case 'chat':
            handleChat(player, data.message);
            break;

        default:
            console.log('未知消息类型:', data.type);
    }
}

// 快速匹配
function handleQuickMatch(player) {
    console.log(`快速匹配: ${player.playerId}`);

    // 检查是否已经在房间中
    if (player.roomCode) {
        handleLeaveRoom(player);
    }

    // 检查匹配队列
    if (matchmaking.length > 0) {
        const opponent = matchmaking.shift();
        
        // 创建房间
        const roomCode = generateRoomCode();
        const room = new Room(roomCode, opponent);
        room.addPlayer(player);
        rooms.set(roomCode, room);

        opponent.roomCode = roomCode;
        player.roomCode = roomCode;

        // 通知双方
        opponent.ws.send(JSON.stringify({
            type: 'roomCreated',
            roomCode: roomCode,
            isHost: true
        }));

        player.ws.send(JSON.stringify({
            type: 'roomJoined',
            roomCode: roomCode,
            isHost: false
        }));

        // 通知房间已满
        room.broadcast({
            type: 'playerJoined',
            opponentName: player.name
        });

        console.log(`匹配成功: ${roomCode}`);
    } else {
        matchmaking.push(player);
        player.ws.send(JSON.stringify({
            type: 'matching',
            message: '正在匹配对手...'
        }));
    }
}

// 创建房间
function handleCreateRoom(player) {
    console.log(`创建房间: ${player.playerId}`);

    // 检查是否已经在房间中
    if (player.roomCode) {
        handleLeaveRoom(player);
    }

    const roomCode = generateRoomCode();
    const room = new Room(roomCode, player);
    rooms.set(roomCode, room);
    player.roomCode = roomCode;

    player.ws.send(JSON.stringify({
        type: 'roomCreated',
        roomCode: roomCode,
        isHost: true
    }));

    console.log(`房间已创建: ${roomCode}`);
}

// 加入房间
function handleJoinRoom(player, roomCode) {
    console.log(`加入房间: ${player.playerId} -> ${roomCode}`);

    const room = rooms.get(roomCode);

    if (!room) {
        player.ws.send(JSON.stringify({
            type: 'error',
            message: '房间不存在'
        }));
        return;
    }

    if (room.isFull()) {
        player.ws.send(JSON.stringify({
            type: 'error',
            message: '房间已满'
        }));
        return;
    }

    if (room.gameState.started) {
        player.ws.send(JSON.stringify({
            type: 'error',
            message: '游戏已开始'
        }));
        return;
    }

    room.addPlayer(player);
    player.roomCode = roomCode;

    player.ws.send(JSON.stringify({
        type: 'roomJoined',
        roomCode: roomCode,
        isHost: false
    }));

    // 通知房主有玩家加入
    room.broadcast({
        type: 'playerJoined',
        opponentName: player.name
    }, player);

    console.log(`玩家已加入房间: ${roomCode}`);
}

// 离开房间
function handleLeaveRoom(player) {
    const roomCode = player.roomCode;
    if (!roomCode) return;

    console.log(`离开房间: ${player.playerId} <- ${roomCode}`);

    const room = rooms.get(roomCode);
    if (room) {
        // 通知其他玩家
        room.broadcast({
            type: 'playerLeft',
            message: '对手已离开房间'
        }, player);

        // 移除玩家
        const isEmpty = room.removePlayer(player);
        
        if (isEmpty) {
            rooms.delete(roomCode);
            console.log(`房间已删除: ${roomCode}`);
        }
    }

    player.roomCode = null;
    player.score = 0;

    // 从匹配队列中移除
    const index = matchmaking.indexOf(player);
    if (index > -1) {
        matchmaking.splice(index, 1);
    }
}

// 开始游戏
function handleStartGame(player) {
    const room = rooms.get(player.roomCode);
    if (!room) return;

    if (!room.isFull()) {
        player.ws.send(JSON.stringify({
            type: 'error',
            message: '等待对手加入'
        }));
        return;
    }

    if (room.host !== player) {
        player.ws.send(JSON.stringify({
            type: 'error',
            message: '只有房主可以开始游戏'
        }));
        return;
    }

    console.log(`开始游戏: ${player.roomCode}`);

    room.gameState.started = true;
    room.gameState.startTime = Date.now();
    room.players.forEach(p => {
        p.score = 0;
        room.gameState.scores[p.playerId] = 0;
    });

    room.broadcast({
        type: 'gameStarted',
        startTime: room.gameState.startTime,
        duration: room.gameState.duration
    });

    // 60秒后自动结束游戏
    setTimeout(() => {
        if (room.gameState.started) {
            handleGameEnd(room);
        }
    }, room.gameState.duration);
}

// 更新分数
function handleUpdateScore(player, score) {
    const room = rooms.get(player.roomCode);
    if (!room || !room.gameState.started) return;

    player.score = score;
    room.gameState.scores[player.playerId] = score;

    // 通知对手分数更新
    room.broadcast({
        type: 'scoreUpdate',
        opponentScore: score
    }, player);
}

// 游戏动作同步
function handleGameAction(player, action) {
    const room = rooms.get(player.roomCode);
    if (!room || !room.gameState.started) return;

    // 广播游戏动作给对手（用于观战或同步）
    room.broadcast({
        type: 'gameAction',
        action: action
    }, player);
}

// 游戏结束
function handleGameEnd(room) {
    console.log(`游戏结束: ${room.roomCode}`);

    const scores = room.players.map(p => ({
        playerId: p.playerId,
        name: p.name,
        score: p.score
    }));

    scores.sort((a, b) => b.score - a.score);

    room.broadcast({
        type: 'gameEnded',
        scores: scores,
        winner: scores[0]
    });

    room.gameState.started = false;
}

// 聊天消息
function handleChat(player, message) {
    const room = rooms.get(player.roomCode);
    if (!room) return;

    room.broadcast({
        type: 'chat',
        sender: player.name,
        message: message,
        isOwn: false
    }, player);

    // 回传确认
    player.ws.send(JSON.stringify({
        type: 'chatSent',
        message: message
    }));
}

// 断开连接处理
function handleDisconnect(ws) {
    const player = players.get(ws);
    if (!player) return;

    console.log(`玩家断开: ${player.playerId}`);

    handleLeaveRoom(player);
    players.delete(ws);
}

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🎮 消消乐对战服务器已启动`);
    console.log(`📡 服务器地址: http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log(`===========================================`);
});

// 定期清理空房间
setInterval(() => {
    rooms.forEach((room, roomCode) => {
        if (room.players.length === 0) {
            rooms.delete(roomCode);
            console.log(`清理空房间: ${roomCode}`);
        }
    });
}, 60000); // 每分钟清理一次
