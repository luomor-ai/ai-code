import React, {createContext, useContext, useEffect, useRef, useState} from 'react';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({children}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState({
    roomCode: null,
    playerName: null,
    opponentName: null,
    isHost: false,
    myScore: 0,
    opponentScore: 0,
  });
  const [messages, setMessages] = useState([]);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messageHandlersRef = useRef({});

  // WebSocket 服务器地址 - 根据实际情况修改
  const WS_URL = 'ws://192.168.1.100:3000'; // 改为你的服务器地址

  const connect = () => {
    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket Connected');
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received message:', data);

          // 调用注册的消息处理器
          if (messageHandlersRef.current[data.type]) {
            messageHandlersRef.current[data.type](data);
          }

          // 处理全局状态更新
          handleGlobalMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      wsRef.current.onerror = error => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket Disconnected');
        setIsConnected(false);
        attemptReconnect();
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      attemptReconnect();
    }
  };

  const attemptReconnect = () => {
    if (!reconnectTimeoutRef.current) {
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 3000);
    }
  };

  const handleGlobalMessage = data => {
    switch (data.type) {
      case 'room_created':
      case 'room_joined':
      case 'match_found':
        setGameState(prev => ({
          ...prev,
          roomCode: data.roomCode,
          playerName: data.playerName || prev.playerName,
          opponentName: data.opponentName || prev.opponentName,
          isHost: data.isHost,
        }));
        break;

      case 'player_joined':
        setGameState(prev => ({
          ...prev,
          opponentName: data.playerName,
        }));
        break;

      case 'score_update':
        if (data.playerName === gameState.opponentName) {
          setGameState(prev => ({
            ...prev,
            opponentScore: data.score,
          }));
        }
        break;

      case 'chat':
        setMessages(prev => [...prev, data]);
        break;
    }
  };

  const send = data => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  const on = (type, handler) => {
    messageHandlersRef.current[type] = handler;
  };

  const off = type => {
    delete messageHandlersRef.current[type];
  };

  const updateGameState = updates => {
    setGameState(prev => ({...prev, ...updates}));
  };

  const resetGameState = () => {
    setGameState({
      roomCode: null,
      playerName: null,
      opponentName: null,
      isHost: false,
      myScore: 0,
      opponentScore: 0,
    });
    setMessages([]);
  };

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    isConnected,
    gameState,
    messages,
    send,
    on,
    off,
    updateGameState,
    resetGameState,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
