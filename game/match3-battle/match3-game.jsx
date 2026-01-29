import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Users, Zap, Trophy, MessageCircle, Copy, Check, Crown, Star } from 'lucide-react';

// 游戏配置
const BOARD_SIZE = 8;
const COLORS = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠'];
const EMOJIS = ['😀', '😎', '🎉', '🔥', '💪', '👍', '❤️', '🎮'];
const GAME_TIME = 120; // 2分钟对战

// WebSocket 连接配置
const WS_URL = 'ws://localhost:8080'; // 需要运行后端服务器

const Match3Game = () => {
  // 游戏状态
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameState, setGameState] = useState('menu'); // menu, creating, joining, waiting, playing, finished
  const [roomCode, setRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [copied, setCopied] = useState(false);
  const [matchType, setMatchType] = useState(''); // create, join, random
  const [ws, setWs] = useState(null);
  const [playerRole, setPlayerRole] = useState(''); // host, guest
  const [combo, setCombo] = useState(0);
  const chatEndRef = useRef(null);

  // 初始化棋盘
  const initializeBoard = useCallback(() => {
    const newBoard = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      const row = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        row.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
      }
      newBoard.push(row);
    }
    return newBoard;
  }, []);

  // WebSocket 连接
  useEffect(() => {
    if (gameState === 'menu' || gameState === 'finished') return;

    const websocket = new WebSocket(WS_URL);
    
    websocket.onopen = () => {
      console.log('WebSocket 连接成功');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'room-created':
          setRoomCode(data.roomCode);
          setGameState('waiting');
          setPlayerRole('host');
          break;
        
        case 'room-joined':
          setOpponentName(data.opponentName);
          setGameState('waiting');
          setPlayerRole('guest');
          break;
        
        case 'game-start':
          setOpponentName(data.opponentName);
          setGameState('playing');
          setBoard(initializeBoard());
          setTimeLeft(GAME_TIME);
          break;
        
        case 'score-update':
          setOpponentScore(data.score);
          break;
        
        case 'chat-message':
          setMessages(prev => [...prev, { 
            sender: data.sender, 
            message: data.message, 
            isEmoji: data.isEmoji 
          }]);
          break;
        
        case 'game-end':
          setGameState('finished');
          break;
        
        case 'opponent-left':
          alert('对手已离开游戏');
          setGameState('menu');
          break;

        case 'error':
          alert(data.message);
          setGameState('menu');
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket 错误:', error);
      alert('连接服务器失败，请确保后端服务器正在运行');
      setGameState('menu');
    };

    websocket.onclose = () => {
      console.log('WebSocket 连接关闭');
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [gameState, initializeBoard]);

  // 游戏计时器
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // 自动滚动聊天
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 检查匹配
  const checkMatches = useCallback((currentBoard) => {
    const matches = [];
    
    // 检查横向匹配
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE - 2; j++) {
        if (currentBoard[i][j] === currentBoard[i][j + 1] && 
            currentBoard[i][j] === currentBoard[i][j + 2]) {
          matches.push([i, j], [i, j + 1], [i, j + 2]);
        }
      }
    }
    
    // 检查纵向匹配
    for (let i = 0; i < BOARD_SIZE - 2; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (currentBoard[i][j] === currentBoard[i + 1][j] && 
            currentBoard[i][j] === currentBoard[i + 2][j]) {
          matches.push([i, j], [i + 1, j], [i + 2, j]);
        }
      }
    }
    
    return matches;
  }, []);

  // 消除方块
  const removeMatches = useCallback((matches) => {
    if (matches.length === 0) return board;
    
    const newBoard = board.map(row => [...row]);
    const uniqueMatches = Array.from(new Set(matches.map(m => JSON.stringify(m))))
      .map(m => JSON.parse(m));
    
    uniqueMatches.forEach(([i, j]) => {
      newBoard[i][j] = null;
    });
    
    const points = uniqueMatches.length * 10 * (combo + 1);
    setScore(prev => prev + points);
    setCombo(prev => prev + 1);
    
    // 发送分数更新
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'score-update',
        score: score + points
      }));
    }
    
    return newBoard;
  }, [board, score, combo, ws]);

  // 下落方块
  const dropTiles = useCallback((currentBoard) => {
    const newBoard = currentBoard.map(row => [...row]);
    
    for (let j = 0; j < BOARD_SIZE; j++) {
      let emptySpaces = 0;
      for (let i = BOARD_SIZE - 1; i >= 0; i--) {
        if (newBoard[i][j] === null) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          newBoard[i + emptySpaces][j] = newBoard[i][j];
          newBoard[i][j] = null;
        }
      }
      
      for (let i = 0; i < emptySpaces; i++) {
        newBoard[i][j] = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
    }
    
    return newBoard;
  }, []);

  // 处理方块点击
  const handleCellClick = (row, col) => {
    if (isAnimating || gameState !== 'playing') return;
    
    if (!selectedCell) {
      setSelectedCell({ row, col });
    } else {
      const { row: prevRow, col: prevCol } = selectedCell;
      
      // 检查是否相邻
      const isAdjacent = 
        (Math.abs(row - prevRow) === 1 && col === prevCol) ||
        (Math.abs(col - prevCol) === 1 && row === prevRow);
      
      if (isAdjacent) {
        // 交换方块
        const newBoard = board.map(r => [...r]);
        [newBoard[row][col], newBoard[prevRow][prevCol]] = 
        [newBoard[prevRow][prevCol], newBoard[row][col]];
        
        setBoard(newBoard);
        setSelectedCell(null);
        setIsAnimating(true);
        
        // 检查并处理匹配
        setTimeout(() => {
          let currentBoard = newBoard;
          let hasMatches = true;
          let iterations = 0;
          
          const processMatches = () => {
            if (!hasMatches || iterations > 10) {
              setIsAnimating(false);
              setCombo(0);
              return;
            }
            
            const matches = checkMatches(currentBoard);
            if (matches.length > 0) {
              currentBoard = removeMatches(matches);
              setTimeout(() => {
                currentBoard = dropTiles(currentBoard);
                setBoard(currentBoard);
                iterations++;
                setTimeout(processMatches, 300);
              }, 200);
            } else {
              hasMatches = false;
              setIsAnimating(false);
              setCombo(0);
            }
          };
          
          processMatches();
        }, 300);
      } else {
        setSelectedCell({ row, col });
      }
    }
  };

  // 创建房间
  const createRoom = () => {
    if (!playerName.trim()) {
      alert('请输入玩家名称');
      return;
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'create-room',
        playerName: playerName.trim()
      }));
    }
  };

  // 加入房间
  const joinRoom = () => {
    if (!playerName.trim()) {
      alert('请输入玩家名称');
      return;
    }
    if (!inputRoomCode.trim()) {
      alert('请输入房间号');
      return;
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'join-room',
        roomCode: inputRoomCode.trim().toUpperCase(),
        playerName: playerName.trim()
      }));
    }
  };

  // 随机匹配
  const randomMatch = () => {
    if (!playerName.trim()) {
      alert('请输入玩家名称');
      return;
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'random-match',
        playerName: playerName.trim()
      }));
      setGameState('waiting');
    }
  };

  // 发送消息
  const sendMessage = (message, isEmoji = false) => {
    if ((!message.trim() && !isEmoji) || !ws) return;
    
    ws.send(JSON.stringify({
      type: 'chat-message',
      message: message,
      isEmoji: isEmoji
    }));
    
    setMessages(prev => [...prev, { 
      sender: playerName, 
      message: message, 
      isEmoji: isEmoji 
    }]);
    setInputMessage('');
  };

  // 复制房间号
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 返回菜单
  const backToMenu = () => {
    if (ws) {
      ws.close();
    }
    setGameState('menu');
    setScore(0);
    setOpponentScore(0);
    setMessages([]);
    setRoomCode('');
    setInputRoomCode('');
    setCombo(0);
  };

  // 渲染主菜单
  const renderMenu = () => (
    <div className="menu-container">
      <div className="game-logo">
        <Sparkles className="logo-icon" size={48} />
        <h1>消消乐对战</h1>
        <p className="subtitle">实时多人竞技</p>
      </div>
      
      <div className="name-input-section">
        <input
          type="text"
          placeholder="输入你的名字"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={12}
          className="name-input"
        />
      </div>
      
      <div className="menu-buttons">
        <button 
          className="menu-btn create-btn"
          onClick={() => {
            setMatchType('create');
            setGameState('creating');
            createRoom();
          }}
        >
          <Users size={24} />
          <span>创建房间</span>
          <small>邀请好友对战</small>
        </button>
        
        <button 
          className="menu-btn join-btn"
          onClick={() => {
            setMatchType('join');
            setGameState('joining');
          }}
        >
          <Zap size={24} />
          <span>加入房间</span>
          <small>输入房间号</small>
        </button>
        
        <button 
          className="menu-btn random-btn"
          onClick={() => {
            setMatchType('random');
            randomMatch();
          }}
        >
          <Trophy size={24} />
          <span>随机匹配</span>
          <small>快速找对手</small>
        </button>
      </div>
    </div>
  );

  // 渲染加入房间界面
  const renderJoining = () => (
    <div className="menu-container">
      <h2>加入房间</h2>
      <div className="join-section">
        <input
          type="text"
          placeholder="输入房间号 (例如: ABCD)"
          value={inputRoomCode}
          onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
          maxLength={4}
          className="room-code-input"
        />
        <div className="join-buttons">
          <button onClick={joinRoom} className="confirm-btn">
            确认加入
          </button>
          <button onClick={backToMenu} className="cancel-btn">
            返回
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染等待界面
  const renderWaiting = () => (
    <div className="menu-container">
      <div className="waiting-section">
        <div className="waiting-icon">
          <Users size={64} className="pulse" />
        </div>
        <h2>等待对手加入...</h2>
        {roomCode && (
          <div className="room-code-display">
            <p>房间号:</p>
            <div className="code-box">
              <span className="code">{roomCode}</span>
              <button onClick={copyRoomCode} className="copy-btn">
                {copied ? <Check size={20} /> : <Copy size={20} />}
              </button>
            </div>
            <p className="hint">分享给你的朋友</p>
          </div>
        )}
        <button onClick={backToMenu} className="cancel-btn">
          取消等待
        </button>
      </div>
    </div>
  );

  // 渲染游戏界面
  const renderGame = () => (
    <div className="game-container">
      {/* 顶部分数栏 */}
      <div className="score-bar">
        <div className="player-score">
          <div className="player-avatar">
            <Crown size={20} />
          </div>
          <div>
            <div className="player-name">{playerName}</div>
            <div className="score">{score}</div>
          </div>
        </div>
        
        <div className="timer">
          <div className="time-display">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
          <div className="time-bar">
            <div 
              className="time-fill" 
              style={{ width: `${(timeLeft / GAME_TIME) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="player-score opponent">
          <div>
            <div className="player-name">{opponentName}</div>
            <div className="score">{opponentScore}</div>
          </div>
          <div className="player-avatar">
            <Star size={20} />
          </div>
        </div>
      </div>

      {/* 连击显示 */}
      {combo > 0 && (
        <div className="combo-display">
          <Zap size={24} />
          <span>COMBO x{combo + 1}</span>
        </div>
      )}

      {/* 游戏棋盘 */}
      <div className="board">
        {board.map((row, i) => (
          <div key={i} className="board-row">
            {row.map((cell, j) => (
              <div
                key={`${i}-${j}`}
                className={`cell ${selectedCell?.row === i && selectedCell?.col === j ? 'selected' : ''}`}
                onClick={() => handleCellClick(i, j)}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 聊天按钮 */}
      <button 
        className="chat-toggle"
        onClick={() => setShowChat(!showChat)}
      >
        <MessageCircle size={24} />
        {messages.length > 0 && <span className="badge">{messages.length}</span>}
      </button>

      {/* 聊天面板 */}
      {showChat && (
        <div className="chat-panel">
          <div className="chat-header">
            <MessageCircle size={20} />
            <span>聊天</span>
            <button onClick={() => setShowChat(false)}>×</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`message ${msg.sender === playerName ? 'own' : 'opponent'}`}
              >
                <span className="sender">{msg.sender}:</span>
                <span className={msg.isEmoji ? 'emoji-msg' : ''}>{msg.message}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="emoji-bar">
            {EMOJIS.map((emoji, idx) => (
              <button 
                key={idx}
                onClick={() => sendMessage(emoji, true)}
                className="emoji-btn"
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="输入消息..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
              maxLength={50}
            />
            <button onClick={() => sendMessage(inputMessage)}>发送</button>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染结束界面
  const renderFinished = () => {
    const won = score > opponentScore;
    const draw = score === opponentScore;
    
    return (
      <div className="menu-container">
        <div className="result-section">
          <div className={`result-icon ${won ? 'win' : draw ? 'draw' : 'lose'}`}>
            {won ? '🏆' : draw ? '🤝' : '😢'}
          </div>
          <h2>{won ? '胜利!' : draw ? '平局!' : '失败'}</h2>
          <div className="final-scores">
            <div className="final-score">
              <div className="label">{playerName}</div>
              <div className="value">{score}</div>
            </div>
            <div className="vs">VS</div>
            <div className="final-score">
              <div className="label">{opponentName}</div>
              <div className="value">{opponentScore}</div>
            </div>
          </div>
          <button onClick={backToMenu} className="menu-btn">
            返回主菜单
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {gameState === 'menu' && renderMenu()}
      {gameState === 'joining' && renderJoining()}
      {gameState === 'waiting' && renderWaiting()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'finished' && renderFinished()}

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        /* 主菜单样式 */
        .menu-container {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 24px;
          padding: 48px;
          max-width: 480px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          animation: slideUp 0.5s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .game-logo {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo-icon {
          color: #667eea;
          margin-bottom: 16px;
          animation: sparkle 2s ease infinite;
        }

        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }

        .game-logo h1 {
          font-size: 36px;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #666;
          font-size: 14px;
        }

        .name-input-section {
          margin-bottom: 32px;
        }

        .name-input {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s;
          outline: none;
        }

        .name-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
        }

        .menu-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .menu-btn {
          padding: 20px 24px;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }

        .menu-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }

        .menu-btn:hover::before {
          left: 100%;
        }

        .menu-btn span {
          flex: 1;
          text-align: left;
        }

        .menu-btn small {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 400;
        }

        .create-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .join-btn {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .random-btn {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        .menu-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        /* 加入房间样式 */
        .join-section {
          text-align: center;
        }

        .join-section h2 {
          margin-bottom: 24px;
          color: #333;
        }

        .room-code-input {
          width: 100%;
          padding: 20px;
          border: 3px solid #667eea;
          border-radius: 12px;
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          letter-spacing: 8px;
          margin-bottom: 24px;
          outline: none;
          text-transform: uppercase;
        }

        .join-buttons {
          display: flex;
          gap: 12px;
        }

        .confirm-btn {
          flex: 1;
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .confirm-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .cancel-btn {
          padding: 16px 32px;
          background: #f5f5f5;
          color: #666;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .cancel-btn:hover {
          background: #e0e0e0;
        }

        /* 等待界面样式 */
        .waiting-section {
          text-align: center;
        }

        .waiting-icon {
          margin-bottom: 24px;
        }

        .pulse {
          animation: pulse 1.5s ease infinite;
          color: #667eea;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .waiting-section h2 {
          margin-bottom: 32px;
          color: #333;
        }

        .room-code-display {
          background: #f8f9fa;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .room-code-display p {
          color: #666;
          margin-bottom: 8px;
        }

        .code-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 16px 0;
        }

        .code {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: 12px;
          color: #667eea;
        }

        .copy-btn {
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .copy-btn:hover {
          background: #5568d3;
        }

        .hint {
          font-size: 14px;
          color: #999;
        }

        /* 游戏界面样式 */
        .game-container {
          max-width: 600px;
          width: 100%;
        }

        .score-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.95);
          padding: 20px;
          border-radius: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .player-score {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .player-score.opponent {
          flex-direction: row-reverse;
        }

        .player-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .player-name {
          font-size: 14px;
          color: #666;
          font-weight: 500;
        }

        .score {
          font-size: 24px;
          font-weight: 800;
          color: #333;
        }

        .timer {
          text-align: center;
        }

        .time-display {
          font-size: 28px;
          font-weight: 800;
          color: #667eea;
          margin-bottom: 8px;
        }

        .time-bar {
          width: 120px;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .time-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 1s linear;
        }

        .combo-display {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(255, 215, 0, 0.95);
          color: white;
          padding: 20px 40px;
          border-radius: 16px;
          font-size: 28px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: comboPopup 0.5s ease;
          box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
          z-index: 1000;
        }

        @keyframes comboPopup {
          0% { transform: translate(-50%, -50%) scale(0); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }

        /* 棋盘样式 */
        .board {
          background: rgba(255, 255, 255, 0.95);
          padding: 16px;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          display: inline-block;
        }

        .board-row {
          display: flex;
        }

        .cell {
          width: 60px;
          height: 60px;
          margin: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          user-select: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .cell:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .cell.selected {
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          transform: scale(1.1);
          box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.3);
        }

        /* 聊天样式 */
        .chat-toggle {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .chat-toggle:hover {
          transform: scale(1.1);
        }

        .badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ff4757;
          color: white;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .chat-panel {
          position: fixed;
          bottom: 100px;
          right: 24px;
          width: 320px;
          height: 480px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease;
        }

        .chat-header {
          padding: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px 20px 0 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .chat-header button {
          margin-left: auto;
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .chat-header button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          max-width: 80%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 14px;
          animation: messageSlide 0.3s ease;
        }

        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.own {
          align-self: flex-end;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .message.opponent {
          align-self: flex-start;
          background: #f5f5f5;
          color: #333;
        }

        .sender {
          font-weight: 600;
          margin-right: 8px;
        }

        .emoji-msg {
          font-size: 24px;
        }

        .emoji-bar {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid #e0e0e0;
          overflow-x: auto;
        }

        .emoji-btn {
          font-size: 24px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .emoji-btn:hover {
          background: #f5f5f5;
          transform: scale(1.2);
        }

        .chat-input {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid #e0e0e0;
        }

        .chat-input input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }

        .chat-input input:focus {
          border-color: #667eea;
        }

        .chat-input button {
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .chat-input button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        /* 结果界面样式 */
        .result-section {
          text-align: center;
        }

        .result-icon {
          font-size: 100px;
          margin-bottom: 24px;
          animation: resultPopup 0.5s ease;
        }

        @keyframes resultPopup {
          0% { transform: scale(0) rotate(-180deg); }
          50% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        .result-section h2 {
          font-size: 36px;
          margin-bottom: 32px;
          color: #333;
        }

        .final-scores {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
          margin-bottom: 32px;
        }

        .final-score {
          text-align: center;
        }

        .final-score .label {
          font-size: 14px;
          color: #666;
          margin-bottom: 8px;
        }

        .final-score .value {
          font-size: 48px;
          font-weight: 800;
          color: #667eea;
        }

        .vs {
          font-size: 24px;
          font-weight: 700;
          color: #999;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .menu-container {
            padding: 32px 24px;
          }

          .board {
            padding: 8px;
          }

          .cell {
            width: 48px;
            height: 48px;
            font-size: 24px;
            margin: 2px;
          }

          .chat-panel {
            width: 280px;
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default Match3Game;
