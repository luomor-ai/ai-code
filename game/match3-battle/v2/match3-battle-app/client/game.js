// WebSocket 连接
let ws = null;
let reconnectInterval = null;

// 游戏状态
const gameState = {
    currentScreen: 'menu',
    roomCode: null,
    playerName: null,
    isHost: false,
    opponentName: null,
    myScore: 0,
    opponentScore: 0,
    gameTimer: 60,
    timerInterval: null,
    board: [],
    selectedCell: null,
    boardSize: 8,
    colors: 6,
    isGameActive: false
};

// 初始化 WebSocket 连接
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket 连接成功');
        updateConnectionStatus(true);
        clearInterval(reconnectInterval);
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
        console.log('WebSocket 连接关闭');
        updateConnectionStatus(false);
        attemptReconnect();
    };

    ws.onerror = (error) => {
        console.error('WebSocket 错误:', error);
        updateConnectionStatus(false);
    };
}

// 更新连接状态显示
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    const buttons = ['createRoomBtn', 'joinRoomBtn', 'randomMatchBtn'];
    
    if (connected) {
        statusElement.textContent = '✓ 已连接';
        statusElement.className = 'connection-status connected';
        buttons.forEach(id => {
            document.getElementById(id).disabled = false;
        });
    } else {
        statusElement.textContent = '✗ 未连接';
        statusElement.className = 'connection-status disconnected';
        buttons.forEach(id => {
            document.getElementById(id).disabled = true;
        });
    }
}

// 尝试重连
function attemptReconnect() {
    if (reconnectInterval) return;
    
    reconnectInterval = setInterval(() => {
        console.log('尝试重连...');
        initWebSocket();
    }, 3000);
}

// 发送消息到服务器
function sendToServer(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    } else {
        console.error('WebSocket 未连接');
        showError('网络连接已断开，请刷新页面重试');
    }
}

// 处理服务器消息
function handleServerMessage(data) {
    console.log('收到服务器消息:', data);

    switch (data.type) {
        case 'room_created':
            handleRoomCreated(data);
            break;
        case 'room_joined':
            handleRoomJoined(data);
            break;
        case 'player_joined':
            handlePlayerJoined(data);
            break;
        case 'match_found':
            handleMatchFound(data);
            break;
        case 'matching':
            // 匹配中...
            break;
        case 'player_left':
            handlePlayerLeft(data);
            break;
        case 'game_start':
            handleGameStart(data);
            break;
        case 'score_update':
            handleScoreUpdate(data);
            break;
        case 'chat':
            handleChatMessage(data);
            break;
        case 'game_end':
            handleGameEnd(data);
            break;
        case 'error':
            showError(data.message);
            break;
        default:
            console.log('未知消息类型:', data.type);
    }
}

// 显示错误消息
function showError(message) {
    alert(message);
}

// 房间创建成功
function handleRoomCreated(data) {
    gameState.playerName = data.playerName;
    gameState.isHost = data.isHost;
    gameState.roomCode = data.roomCode;

    closeModal('createRoomModal');
    showScreen('room');
    
    document.getElementById('roomCodeDisplay').textContent = data.roomCode;
    document.getElementById('player1Name').textContent = data.playerName;
    document.getElementById('chatToggle').style.display = 'flex';
}

// 加入房间成功
function handleRoomJoined(data) {
    gameState.playerName = data.playerName;
    gameState.isHost = data.isHost;
    gameState.roomCode = data.roomCode;
    gameState.opponentName = data.opponentName;

    closeModal('joinRoomModal');
    showScreen('room');
    
    document.getElementById('roomCodeDisplay').textContent = data.roomCode;
    document.getElementById('player1Name').textContent = data.playerName;
    
    document.getElementById('player2Container').innerHTML = `
        <div class="player-card">
            <div class="player-avatar">👤</div>
            <div class="player-info">
                <div class="player-name">${data.opponentName}</div>
                <div class="player-status">已准备</div>
            </div>
        </div>
    `;
    
    document.getElementById('startGameBtn').disabled = false;
    document.getElementById('chatToggle').style.display = 'flex';
}

// 有玩家加入房间
function handlePlayerJoined(data) {
    gameState.opponentName = data.playerName;
    
    document.getElementById('player2Container').innerHTML = `
        <div class="player-card">
            <div class="player-avatar">👤</div>
            <div class="player-info">
                <div class="player-name">${data.playerName}</div>
                <div class="player-status">已准备</div>
            </div>
        </div>
    `;
    
    document.getElementById('startGameBtn').disabled = false;
}

// 匹配成功
function handleMatchFound(data) {
    gameState.roomCode = data.roomCode;
    gameState.opponentName = data.opponentName;
    gameState.isHost = data.isHost;

    closeModal('matchingModal');
    showScreen('room');
    
    document.getElementById('roomCodeDisplay').textContent = data.roomCode;
    document.getElementById('player1Name').textContent = gameState.playerName;
    
    document.getElementById('player2Container').innerHTML = `
        <div class="player-card">
            <div class="player-avatar">👤</div>
            <div class="player-info">
                <div class="player-name">${data.opponentName}</div>
                <div class="player-status">已准备</div>
            </div>
        </div>
    `;
    
    document.getElementById('startGameBtn').disabled = false;
    document.getElementById('chatToggle').style.display = 'flex';
}

// 玩家离开
function handlePlayerLeft(data) {
    showError(`${data.playerName} 离开了房间`);
    backToMenu();
}

// 游戏开始
function handleGameStart(data) {
    showScreen('game');
    document.getElementById('gamePlayer1Name').textContent = gameState.playerName;
    document.getElementById('gamePlayer2Name').textContent = gameState.opponentName;
    
    gameState.isGameActive = true;
    gameState.myScore = 0;
    gameState.opponentScore = 0;
    
    document.getElementById('player1Score').textContent = '0';
    document.getElementById('player2Score').textContent = '0';
    
    initializeBoard();
    startTimer();
}

// 分数更新
function handleScoreUpdate(data) {
    if (data.playerName === gameState.opponentName) {
        gameState.opponentScore = data.score;
        document.getElementById('player2Score').textContent = data.score;
    }
}

// 聊天消息
function handleChatMessage(data) {
    const isOwn = data.sender === gameState.playerName;
    addMessage(data.sender, data.message, isOwn);
}

// 游戏结束
function handleGameEnd(data) {
    clearInterval(gameState.timerInterval);
    gameState.isGameActive = false;
    
    const myFinalScore = data.scores[gameState.playerName] || gameState.myScore;
    const opponentFinalScore = data.scores[gameState.opponentName] || gameState.opponentScore;
    
    const isWin = myFinalScore > opponentFinalScore;
    
    document.getElementById('resultTitle').textContent = isWin ? '🏆 胜利!' : '😢 失败';
    document.getElementById('resultTitle').className = `result-title ${isWin ? 'win' : 'lose'}`;
    document.getElementById('finalPlayer1Name').textContent = gameState.playerName;
    document.getElementById('finalPlayer1Score').textContent = myFinalScore;
    document.getElementById('finalPlayer2Name').textContent = gameState.opponentName;
    document.getElementById('finalPlayer2Score').textContent = opponentFinalScore;
    
    showScreen('result');
}

// UI 交互函数
function showCreateRoom() {
    document.getElementById('createRoomModal').classList.add('active');
    document.getElementById('createNickname').value = '';
}

function showJoinRoom() {
    document.getElementById('joinRoomModal').classList.add('active');
    document.getElementById('joinRoomCode').value = '';
    document.getElementById('joinNickname').value = '';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function createRoom() {
    const nickname = document.getElementById('createNickname').value.trim();
    if (!nickname) {
        alert('请输入昵称');
        return;
    }

    sendToServer({
        type: 'create_room',
        nickname: nickname
    });
}

function joinRoom() {
    const roomCode = document.getElementById('joinRoomCode').value.trim();
    const nickname = document.getElementById('joinNickname').value.trim();
    
    if (!roomCode || roomCode.length !== 6) {
        alert('请输入正确的6位房间号');
        return;
    }
    
    if (!nickname) {
        alert('请输入昵称');
        return;
    }

    sendToServer({
        type: 'join_room',
        roomCode: roomCode,
        nickname: nickname
    });
}

function randomMatch() {
    const nickname = '玩家' + Math.floor(Math.random() * 10000);
    gameState.playerName = nickname;
    
    document.getElementById('matchingModal').classList.add('active');
    
    sendToServer({
        type: 'random_match',
        nickname: nickname
    });
}

function cancelMatching() {
    sendToServer({
        type: 'leave_room'
    });
    closeModal('matchingModal');
}

function leaveRoom() {
    if (confirm('确定要离开房间吗？')) {
        sendToServer({
            type: 'leave_room'
        });
        
        document.getElementById('chatToggle').style.display = 'none';
        showScreen('menu');
        resetGameState();
    }
}

function startGame() {
    sendToServer({
        type: 'start_game'
    });
}

// 游戏逻辑
function initializeBoard() {
    const board = document.getElementById('gameBoard');
    board.innerHTML = '';
    gameState.board = [];

    for (let i = 0; i < gameState.boardSize; i++) {
        gameState.board[i] = [];
        for (let j = 0; j < gameState.boardSize; j++) {
            const color = Math.floor(Math.random() * gameState.colors);
            gameState.board[i][j] = color;
            
            const cell = document.createElement('div');
            cell.className = `cell color-${color}`;
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.textContent = getGemIcon(color);
            cell.onclick = () => selectCell(i, j);
            
            board.appendChild(cell);
        }
    }
}

function getGemIcon(color) {
    const icons = ['💎', '💚', '⭐', '🔷', '❤️', '🟣'];
    return icons[color];
}

function selectCell(row, col) {
    if (!gameState.isGameActive) return;
    
    const cells = document.querySelectorAll('.cell');
    
    if (gameState.selectedCell === null) {
        gameState.selectedCell = { row, col };
        cells[row * gameState.boardSize + col].classList.add('selected');
    } else {
        const prevRow = gameState.selectedCell.row;
        const prevCol = gameState.selectedCell.col;
        
        const isAdjacent = Math.abs(row - prevRow) + Math.abs(col - prevCol) === 1;
        
        if (isAdjacent) {
            swapCells(prevRow, prevCol, row, col);
        }
        
        cells.forEach(c => c.classList.remove('selected'));
        gameState.selectedCell = null;
    }
}

function swapCells(row1, col1, row2, col2) {
    const temp = gameState.board[row1][col1];
    gameState.board[row1][col1] = gameState.board[row2][col2];
    gameState.board[row2][col2] = temp;
    
    updateBoard();
    
    setTimeout(() => {
        if (checkMatches()) {
            processMatches();
        } else {
            const temp = gameState.board[row1][col1];
            gameState.board[row1][col1] = gameState.board[row2][col2];
            gameState.board[row2][col2] = temp;
            updateBoard();
        }
    }, 200);
}

function checkMatches() {
    let hasMatch = false;
    const matched = Array(gameState.boardSize).fill(null).map(() => 
        Array(gameState.boardSize).fill(false)
    );

    for (let i = 0; i < gameState.boardSize; i++) {
        for (let j = 0; j < gameState.boardSize - 2; j++) {
            const color = gameState.board[i][j];
            if (color === gameState.board[i][j + 1] && color === gameState.board[i][j + 2]) {
                matched[i][j] = matched[i][j + 1] = matched[i][j + 2] = true;
                hasMatch = true;
            }
        }
    }

    for (let i = 0; i < gameState.boardSize - 2; i++) {
        for (let j = 0; j < gameState.boardSize; j++) {
            const color = gameState.board[i][j];
            if (color === gameState.board[i + 1][j] && color === gameState.board[i + 2][j]) {
                matched[i][j] = matched[i + 1][j] = matched[i + 2][j] = true;
                hasMatch = true;
            }
        }
    }

    gameState.matched = matched;
    return hasMatch;
}

function processMatches() {
    let score = 0;
    const cells = document.querySelectorAll('.cell');

    for (let i = 0; i < gameState.boardSize; i++) {
        for (let j = 0; j < gameState.boardSize; j++) {
            if (gameState.matched[i][j]) {
                cells[i * gameState.boardSize + j].classList.add('matched');
                score += 10;
            }
        }
    }

    gameState.myScore += score;
    document.getElementById('player1Score').textContent = gameState.myScore;
    
    // 发送分数更新到服务器
    sendToServer({
        type: 'score_update',
        score: gameState.myScore
    });

    setTimeout(() => {
        fillBoard();
        updateBoard();
        
        setTimeout(() => {
            if (checkMatches()) {
                processMatches();
            }
        }, 300);
    }, 300);
}

function fillBoard() {
    for (let j = 0; j < gameState.boardSize; j++) {
        let emptyCount = 0;
        
        for (let i = gameState.boardSize - 1; i >= 0; i--) {
            if (gameState.matched[i][j]) {
                emptyCount++;
            } else if (emptyCount > 0) {
                gameState.board[i + emptyCount][j] = gameState.board[i][j];
            }
        }
        
        for (let i = 0; i < emptyCount; i++) {
            gameState.board[i][j] = Math.floor(Math.random() * gameState.colors);
        }
    }
}

function updateBoard() {
    const cells = document.querySelectorAll('.cell');
    for (let i = 0; i < gameState.boardSize; i++) {
        for (let j = 0; j < gameState.boardSize; j++) {
            const cell = cells[i * gameState.boardSize + j];
            const color = gameState.board[i][j];
            cell.className = `cell color-${color}`;
            cell.textContent = getGemIcon(color);
        }
    }
}

function startTimer() {
    gameState.gameTimer = 60;
    document.getElementById('gameTimer').textContent = gameState.gameTimer;
    
    gameState.timerInterval = setInterval(() => {
        gameState.gameTimer--;
        document.getElementById('gameTimer').textContent = gameState.gameTimer;
        
        if (gameState.gameTimer <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(gameState.timerInterval);
    gameState.isGameActive = false;
    
    sendToServer({
        type: 'game_end',
        score: gameState.myScore
    });
}

// 聊天功能
function toggleChat() {
    const panel = document.getElementById('chatPanel');
    panel.classList.toggle('open');
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    sendToServer({
        type: 'chat',
        message: message
    });
    
    input.value = '';
}

function sendEmoji(emoji) {
    sendToServer({
        type: 'chat',
        message: emoji
    });
}

function addMessage(sender, message, isOwn) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'own' : ''}`;
    
    messageDiv.innerHTML = `
        <div class="message-sender">${sender}</div>
        <div class="message-bubble">${escapeHtml(message)}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 屏幕导航
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId + 'Screen').classList.add('active');
    gameState.currentScreen = screenId;
}

function backToMenu() {
    sendToServer({
        type: 'leave_room'
    });
    
    showScreen('menu');
    document.getElementById('chatToggle').style.display = 'none';
    document.getElementById('chatPanel').classList.remove('open');
    resetGameState();
}

function resetGameState() {
    gameState.roomCode = null;
    gameState.isHost = false;
    gameState.opponentName = null;
    gameState.myScore = 0;
    gameState.opponentScore = 0;
    gameState.gameTimer = 60;
    gameState.isGameActive = false;
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // 清空聊天记录
    document.getElementById('chatMessages').innerHTML = '';
}

// 页面加载时初始化
window.addEventListener('load', () => {
    initWebSocket();
});

// 页面关闭时清理
window.addEventListener('beforeunload', () => {
    if (ws) {
        ws.close();
    }
});
