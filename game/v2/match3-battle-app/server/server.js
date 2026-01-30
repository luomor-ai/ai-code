const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 游戏状态管理
const rooms = new Map(); // 房间ID -> 房间信息
const players = new Map(); // WebSocket -> 玩家信息
const waitingPlayers = []; // 等待匹配的玩家队列

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client')));

// 生成房间号
function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 生成唯一ID
function generateId() {
    return crypto.randomBytes(16).toString('hex');
}

// 广播消息到房间
function broadcastToRoom(roomCode, message, excludeWs = null) {
    const room = rooms.get(roomCode);
    if (!room) return;

    room.players.forEach(playerWs => {
        if (playerWs !== excludeWs && playerWs.readyState === WebSocket.OPEN) {
            playerWs.send(JSON.stringify(message));
        }
    });
}

// WebSocket 连接处理
wss.on('connection', (ws) => {
    console.log('新客户端连接');

    const playerId = generateId();
    players.set(ws, {
        id: playerId,
        nickname: null,
        roomCode: null
    });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            console.error('消息处理错误:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: '无效的消息格式'
            }));
        }
    });

    ws.on('close', () => {
        handleDisconnect(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket 错误:', error);
    });
});

// 处理消息
function handleMessage(ws, data) {
    const player = players.get(ws);

    switch (data.type) {
        case 'create_room':
            handleCreateRoom(ws, data);
            break;
        case 'join_room':
            handleJoinRoom(ws, data);
            break;
        case 'random_match':
            handleRandomMatch(ws, data);
            break;
        case 'leave_room':
            handleLeaveRoom(ws);
            break;
        case 'start_game':
            handleStartGame(ws);
            break;
        case 'game_move':
            handleGameMove(ws, data);
            break;
        case 'score_update':
            handleScoreUpdate(ws, data);
            break;
        case 'chat':
            handleChat(ws, data);
            break;
        case 'game_end':
            handleGameEnd(ws, data);
            break;
        default:
            console.log('未知消息类型:', data.type);
    }
}

// 创建房间
function handleCreateRoom(ws, data) {
    const player = players.get(ws);
    const roomCode = generateRoomCode();
    
    player.nickname = data.nickname;
    player.roomCode = roomCode;

    const room = {
        code: roomCode,
        host: ws,
        players: [ws],
        status: 'waiting', // waiting, playing, finished
        scores: {},
        createdAt: Date.now()
    };

    rooms.set(roomCode, room);

    ws.send(JSON.stringify({
        type: 'room_created',
        roomCode: roomCode,
        playerName: data.nickname,
        isHost: true
    }));

    console.log(`房间创建: ${roomCode}, 玩家: ${data.nickname}`);
}

// 加入房间
function handleJoinRoom(ws, data) {
    const player = players.get(ws);
    const room = rooms.get(data.roomCode);

    if (!room) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '房间不存在'
        }));
        return;
    }

    if (room.players.length >= 2) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '房间已满'
        }));
        return;
    }

    if (room.status !== 'waiting') {
        ws.send(JSON.stringify({
            type: 'error',
            message: '游戏已开始'
        }));
        return;
    }

    player.nickname = data.nickname;
    player.roomCode = data.roomCode;
    room.players.push(ws);

    // 通知加入者
    ws.send(JSON.stringify({
        type: 'room_joined',
        roomCode: data.roomCode,
        playerName: data.nickname,
        opponentName: players.get(room.host).nickname,
        isHost: false
    }));

    // 通知房主
    room.host.send(JSON.stringify({
        type: 'player_joined',
        playerName: data.nickname
    }));

    console.log(`玩家 ${data.nickname} 加入房间 ${data.roomCode}`);
}

// 随机匹配
function handleRandomMatch(ws, data) {
    const player = players.get(ws);
    player.nickname = data.nickname;

    // 检查是否有等待的玩家
    if (waitingPlayers.length > 0) {
        const opponent = waitingPlayers.shift();
        const opponentPlayer = players.get(opponent);

        // 创建房间
        const roomCode = generateRoomCode();
        player.roomCode = roomCode;
        opponentPlayer.roomCode = roomCode;

        const room = {
            code: roomCode,
            host: opponent,
            players: [opponent, ws],
            status: 'waiting',
            scores: {},
            createdAt: Date.now()
        };

        rooms.set(roomCode, room);

        // 通知双方
        opponent.send(JSON.stringify({
            type: 'match_found',
            roomCode: roomCode,
            opponentName: data.nickname,
            isHost: true
        }));

        ws.send(JSON.stringify({
            type: 'match_found',
            roomCode: roomCode,
            opponentName: opponentPlayer.nickname,
            isHost: false
        }));

        console.log(`匹配成功: ${opponentPlayer.nickname} vs ${data.nickname}`);
    } else {
        // 加入等待队列
        waitingPlayers.push(ws);
        ws.send(JSON.stringify({
            type: 'matching',
            message: '正在寻找对手...'
        }));
        console.log(`玩家 ${data.nickname} 加入匹配队列`);
    }
}

// 离开房间
function handleLeaveRoom(ws) {
    const player = players.get(ws);
    if (!player.roomCode) return;

    const room = rooms.get(player.roomCode);
    if (room) {
        // 通知其他玩家
        broadcastToRoom(player.roomCode, {
            type: 'player_left',
            playerName: player.nickname
        }, ws);

        // 删除房间
        rooms.delete(player.roomCode);
    }

    // 从等待队列移除
    const waitingIndex = waitingPlayers.indexOf(ws);
    if (waitingIndex > -1) {
        waitingPlayers.splice(waitingIndex, 1);
    }

    player.roomCode = null;
    console.log(`玩家 ${player.nickname} 离开房间`);
}

// 开始游戏
function handleStartGame(ws) {
    const player = players.get(ws);
    const room = rooms.get(player.roomCode);

    if (!room) return;

    if (room.host !== ws) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '只有房主可以开始游戏'
        }));
        return;
    }

    if (room.players.length < 2) {
        ws.send(JSON.stringify({
            type: 'error',
            message: '等待对手加入'
        }));
        return;
    }

    room.status = 'playing';
    room.scores = {};
    room.players.forEach(playerWs => {
        const p = players.get(playerWs);
        room.scores[p.nickname] = 0;
    });

    // 通知所有玩家开始游戏
    broadcastToRoom(player.roomCode, {
        type: 'game_start',
        players: room.players.map(p => players.get(p).nickname)
    });

    console.log(`游戏开始: 房间 ${player.roomCode}`);
}

// 处理游戏移动
function handleGameMove(ws, data) {
    const player = players.get(ws);
    const room = rooms.get(player.roomCode);

    if (!room || room.status !== 'playing') return;

    // 广播移动到对手
    broadcastToRoom(player.roomCode, {
        type: 'opponent_move',
        move: data.move
    }, ws);
}

// 更新分数
function handleScoreUpdate(ws, data) {
    const player = players.get(ws);
    const room = rooms.get(player.roomCode);

    if (!room || room.status !== 'playing') return;

    room.scores[player.nickname] = data.score;

    // 广播分数更新
    broadcastToRoom(player.roomCode, {
        type: 'score_update',
        playerName: player.nickname,
        score: data.score
    }, ws);
}

// 聊天
function handleChat(ws, data) {
    const player = players.get(ws);
    const room = rooms.get(player.roomCode);

    if (!room) return;

    // 广播聊天消息
    broadcastToRoom(player.roomCode, {
        type: 'chat',
        sender: player.nickname,
        message: data.message,
        timestamp: Date.now()
    });
}

// 游戏结束
function handleGameEnd(ws, data) {
    const player = players.get(ws);
    const room = rooms.get(player.roomCode);

    if (!room) return;

    room.status = 'finished';

    // 广播游戏结束
    broadcastToRoom(player.roomCode, {
        type: 'game_end',
        scores: room.scores
    });

    console.log(`游戏结束: 房间 ${player.roomCode}`, room.scores);
}

// 处理断开连接
function handleDisconnect(ws) {
    const player = players.get(ws);
    if (!player) return;

    console.log(`客户端断开: ${player.nickname || '未知'}`);

    // 离开房间
    handleLeaveRoom(ws);

    // 删除玩家
    players.delete(ws);
}

// 定期清理过期房间
setInterval(() => {
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30分钟

    for (const [code, room] of rooms.entries()) {
        if (now - room.createdAt > timeout && room.status === 'waiting') {
            rooms.delete(code);
            console.log(`清理过期房间: ${code}`);
        }
    }
}, 5 * 60 * 1000); // 每5分钟清理一次

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`WebSocket 服务器已启动`);
});
