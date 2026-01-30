// 游戏状态
let gameState = {
    playerId: null,
    playerName: '',
    roomCode: '',
    isHost: false,
    opponentConnected: false,
    opponentName: '',
    myScore: 0,
    opponentScore: 0,
    gameTime: 60,
    grid: [],
    selectedCell: null,
    gameTimer: null,
    gameStartTime: null
};

// WebSocket 连接
let ws = null;
let reconnectInterval = null;

// 连接服务器
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket 已连接');
        updateConnectionStatus(true);
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
        } catch (error) {
            console.error('消息解析错误:', error);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket 已断开');
        updateConnectionStatus(false);
        // 尝试重连
        if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
                console.log('尝试重连...');
                connectWebSocket();
            }, 3000);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
    };
}

// 更新连接状态
function updateConnectionStatus(connected) {
    const statusDiv = document.getElementById('connectionStatus');
    const statusDot = statusDiv.querySelector('.status-dot');
    const statusText = statusDiv.querySelector('span');

    if (connected) {
        statusDiv.className = 'connection-status connected';
        statusDot.className = 'status-dot connected';
        statusText.textContent = '已连接';
    } else {
        statusDiv.className = 'connection-status disconnected';
        statusDot.className = 'status-dot disconnected';
        statusText.textContent = '未连接';
    }
}

// 发送消息到服务器
function sendToServer(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    } else {
        showToast('连接已断开，请刷新页面');
    }
}

// 处理服务器消息
function handleServerMessage(data) {
    console.log('收到消息:', data);

    switch (data.type) {
        case 'connected':
            gameState.playerId = data.playerId;
            gameState.playerName = data.playerName;
            break;

        case 'matching':
            showToast(data.message);
            break;

        case 'roomCreated':
            gameState.roomCode = data.roomCode;
            gameState.isHost = data.isHost;
            document.getElementById('roomCode').textContent = data.roomCode;
            showScreen('roomScreen');
            if (data.isHost) {
                document.getElementById('startBtnText').textContent = '等待对手...';
            }
            break;

        case 'roomJoined':
            gameState.roomCode = data.roomCode;
            gameState.isHost = data.isHost;
            document.getElementById('roomCode').textContent = data.roomCode;
            showScreen('roomScreen');
            break;

        case 'playerJoined':
            gameState.opponentConnected = true;
            gameState.opponentName = data.opponentName;
            const opponentSlot = document.getElementById('opponentSlot');
            opponentSlot.classList.add('active');
            opponentSlot.innerHTML = `
                <div class="player-avatar">👤</div>
                <div class="player-name">${data.opponentName}</div>
            `;
            if (gameState.isHost) {
                document.getElementById('startBtn').disabled = false;
                document.getElementById('startBtnText').textContent = '开始游戏';
            }
            showToast('对手已加入！');
            break;

        case 'playerLeft':
            showToast(data.message);
            if (document.getElementById('gameScreen').classList.contains('active')) {
                // 游戏中对手离开，返回主页
                backToHome();
            } else {
                // 房间中对手离开
                gameState.opponentConnected = false;
                const opponentSlot = document.getElementById('opponentSlot');
                opponentSlot.classList.remove('active');
                opponentSlot.innerHTML = `
                    <div class="player-avatar">❓</div>
                    <div class="waiting-text">等待玩家...</div>
                `;
                document.getElementById('startBtn').disabled = true;
                document.getElementById('startBtnText').textContent = '等待对手...';
            }
            break;

        case 'gameStarted':
            gameState.gameStartTime = data.startTime;
            initializeGrid();
            showScreen('gameScreen');
            startTimer(data.duration);
            addChatMessage('系统', '游戏开始！', false, true);
            break;

        case 'scoreUpdate':
            gameState.opponentScore = data.opponentScore;
            document.getElementById('opponentScore').textContent = data.opponentScore;
            break;

        case 'gameEnded':
            clearInterval(gameState.gameTimer);
            const myScoreInResults = data.scores.find(s => s.playerId === gameState.playerId);
            const opponentScoreInResults = data.scores.find(s => s.playerId !== gameState.playerId);
            
            gameState.myScore = myScoreInResults ? myScoreInResults.score : 0;
            gameState.opponentScore = opponentScoreInResults ? opponentScoreInResults.score : 0;
            
            const won = data.winner.playerId === gameState.playerId;
            showGameResult(won);
            break;

        case 'chat':
            addChatMessage(data.sender, data.message, data.isOwn);
            break;

        case 'chatSent':
            // 消息发送确认，客户端已经显示了
            break;

        case 'error':
            showToast(data.message);
            break;

        default:
            console.log('未处理的消息类型:', data.type);
    }
}

// 显示提示
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}

// 屏幕切换
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// 快速匹配
function quickMatch() {
    sendToServer({ type: 'quickMatch' });
}

// 显示创建房间
function showCreateRoom() {
    sendToServer({ type: 'createRoom' });
}

// 显示加入房间模态框
function showJoinRoom() {
    document.getElementById('joinRoomModal').classList.add('active');
    document.getElementById('roomCodeInput').value = '';
}

// 关闭加入房间模态框
function closeJoinModal() {
    document.getElementById('joinRoomModal').classList.remove('active');
}

// 加入房间
function joinRoom() {
    const code = document.getElementById('roomCodeInput').value.toUpperCase().trim();
    if (code.length === 4) {
        sendToServer({ 
            type: 'joinRoom',
            roomCode: code
        });
        closeJoinModal();
    } else {
        showToast('请输入4位房间号');
    }
}

// 复制房间号
function copyRoomCode() {
    const code = gameState.roomCode;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
            showToast('房间号已复制: ' + code);
        }).catch(() => {
            showToast('复制失败');
        });
    } else {
        // 降级方案
        const input = document.createElement('input');
        input.value = code;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('房间号已复制: ' + code);
    }
}

// 离开房间
function leaveRoom() {
    sendToServer({ type: 'leaveRoom' });
    resetGameState();
    showScreen('homeScreen');
}

// 重置游戏状态
function resetGameState() {
    gameState.roomCode = '';
    gameState.isHost = false;
    gameState.opponentConnected = false;
    gameState.opponentName = '';
    gameState.myScore = 0;
    gameState.opponentScore = 0;
    gameState.grid = [];
    gameState.selectedCell = null;
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
    }
    document.getElementById('myScore').textContent = '0';
    document.getElementById('opponentScore').textContent = '0';
    document.getElementById('chatMessages').innerHTML = '';
}

// 开始游戏
function startGame() {
    if (!gameState.opponentConnected) {
        showToast('等待对手加入');
        return;
    }
    sendToServer({ type: 'startGame' });
}

// 初始化游戏网格
function initializeGrid() {
    const grid = document.getElementById('gameGrid');
    grid.innerHTML = '';
    gameState.grid = [];
    gameState.myScore = 0;
    document.getElementById('myScore').textContent = '0';
    
    for (let i = 0; i < 8; i++) {
        gameState.grid[i] = [];
        for (let j = 0; j < 8; j++) {
            let color;
            do {
                color = Math.floor(Math.random() * 6);
            } while (wouldCreateMatch(i, j, color));
            
            gameState.grid[i][j] = color;
            
            const cell = document.createElement('div');
            cell.className = `cell color-${color}`;
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.onclick = () => selectCell(i, j);
            grid.appendChild(cell);
        }
    }
}

// 检查是否会立即形成匹配
function wouldCreateMatch(row, col, color) {
    // 检查横向
    let horizontalCount = 1;
    if (col >= 1 && gameState.grid[row][col - 1] === color) horizontalCount++;
    if (col >= 2 && gameState.grid[row][col - 2] === color) horizontalCount++;
    
    // 检查纵向
    let verticalCount = 1;
    if (row >= 1 && gameState.grid[row - 1][col] === color) verticalCount++;
    if (row >= 2 && gameState.grid[row - 2][col] === color) verticalCount++;
    
    return horizontalCount >= 3 || verticalCount >= 3;
}

// 选择方块
function selectCell(row, col) {
    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    
    if (!gameState.selectedCell) {
        gameState.selectedCell = {row, col};
        cell.classList.add('selected');
    } else {
        const prevRow = gameState.selectedCell.row;
        const prevCol = gameState.selectedCell.col;
        
        // 检查是否相邻
        const isAdjacent = 
            (Math.abs(row - prevRow) === 1 && col === prevCol) ||
            (Math.abs(col - prevCol) === 1 && row === prevRow);
        
        if (isAdjacent) {
            swapCells(prevRow, prevCol, row, col);
        }
        
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected'));
        gameState.selectedCell = null;
    }
}

// 交换方块
function swapCells(row1, col1, row2, col2) {
    // 交换颜色
    const temp = gameState.grid[row1][col1];
    gameState.grid[row1][col1] = gameState.grid[row2][col2];
    gameState.grid[row2][col2] = temp;
    
    updateGrid();
    
    setTimeout(() => {
        const matches = findMatches();
        if (matches.length > 0) {
            removeMatches(matches);
        } else {
            // 如果没有匹配，交换回去
            const temp = gameState.grid[row1][col1];
            gameState.grid[row1][col1] = gameState.grid[row2][col2];
            gameState.grid[row2][col2] = temp;
            updateGrid();
        }
    }, 200);
}

// 查找匹配
function findMatches() {
    const matches = [];
    const checked = new Set();
    
    // 横向检查
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 6; j++) {
            const color = gameState.grid[i][j];
            if (color === gameState.grid[i][j+1] && color === gameState.grid[i][j+2]) {
                for (let k = j; k <= j + 2; k++) {
                    const key = `${i},${k}`;
                    if (!checked.has(key)) {
                        matches.push({row: i, col: k});
                        checked.add(key);
                    }
                }
            }
        }
    }
    
    // 纵向检查
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 8; j++) {
            const color = gameState.grid[i][j];
            if (color === gameState.grid[i+1][j] && color === gameState.grid[i+2][j]) {
                for (let k = i; k <= i + 2; k++) {
                    const key = `${k},${j}`;
                    if (!checked.has(key)) {
                        matches.push({row: k, col: j});
                        checked.add(key);
                    }
                }
            }
        }
    }
    
    return matches;
}

// 移除匹配
function removeMatches(matches) {
    matches.forEach(match => {
        const cell = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
        if (cell) {
            cell.classList.add('matched');
        }
        gameState.grid[match.row][match.col] = null;
    });
    
    gameState.myScore += matches.length * 10;
    document.getElementById('myScore').textContent = gameState.myScore;
    
    // 发送分数更新到服务器
    sendToServer({
        type: 'updateScore',
        score: gameState.myScore
    });
    
    setTimeout(() => {
        dropCells();
    }, 300);
}

// 方块下落
function dropCells() {
    for (let j = 0; j < 8; j++) {
        let emptySpaces = 0;
        for (let i = 7; i >= 0; i--) {
            if (gameState.grid[i][j] === null) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                gameState.grid[i + emptySpaces][j] = gameState.grid[i][j];
                gameState.grid[i][j] = null;
            }
        }
        
        // 填充新方块
        for (let i = 0; i < emptySpaces; i++) {
            gameState.grid[i][j] = Math.floor(Math.random() * 6);
        }
    }
    
    updateGrid();
    
    setTimeout(() => {
        const newMatches = findMatches();
        if (newMatches.length > 0) {
            removeMatches(newMatches);
        }
    }, 300);
}

// 更新网格显示
function updateGrid() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const color = gameState.grid[row][col];
        cell.className = `cell color-${color}`;
    });
}

// 计时器
function startTimer(duration) {
    const timerFill = document.getElementById('timerFill');
    let timeLeft = duration;
    const startTime = Date.now();
    
    gameState.gameTimer = setInterval(() => {
        const elapsed = Date.now() - startTime;
        timeLeft = duration - elapsed;
        
        if (timeLeft <= 0) {
            clearInterval(gameState.gameTimer);
            timerFill.style.width = '0%';
            // 服务器会发送游戏结束消息
        } else {
            const percentage = (timeLeft / duration) * 100;
            timerFill.style.width = percentage + '%';
        }
    }, 100);
}

// 显示游戏结果
function showGameResult(won) {
    document.getElementById('resultIcon').textContent = won ? '🏆' : '😔';
    document.getElementById('resultTitle').textContent = won ? '胜利！' : '失败';
    document.getElementById('finalMyScore').textContent = gameState.myScore;
    document.getElementById('finalOpponentScore').textContent = gameState.opponentScore;
    
    showScreen('resultScreen');
}

// 返回主页
function backToHome() {
    sendToServer({ type: 'leaveRoom' });
    resetGameState();
    showScreen('homeScreen');
}

// 再来一局
function playAgain() {
    backToHome();
    setTimeout(() => {
        quickMatch();
    }, 300);
}

// 聊天功能
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        sendToServer({
            type: 'chat',
            message: message
        });
        
        // 立即显示自己的消息
        addChatMessage(gameState.playerName, message, true);
        input.value = '';
    }
}

function addChatMessage(sender, message, isOwn, isSystem = false) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isOwn ? 'own' : ''}`;
    
    if (isSystem) {
        messageDiv.innerHTML = `
            <div style="width: 100%; text-align: center; color: #999; font-size: 12px; margin: 10px 0;">
                ${message}
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">${sender[0]}</div>
            <div class="message-bubble">${escapeHtml(message)}</div>
        `;
    }
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 表情包功能
function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    picker.classList.toggle('active');
}

function insertEmoji(emoji) {
    const input = document.getElementById('chatInput');
    input.value += emoji;
    input.focus();
    toggleEmojiPicker();
}

// 点击其他地方关闭表情选择器
document.addEventListener('click', (e) => {
    const picker = document.getElementById('emojiPicker');
    const emojiBtn = document.querySelector('.emoji-btn');
    if (picker && emojiBtn && !picker.contains(e.target) && e.target !== emojiBtn) {
        picker.classList.remove('active');
    }
});

// 回车发送消息
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

// 初始化连接
connectWebSocket();
