import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useWebSocket} from '../context/WebSocketContext';

const RoomScreen = ({navigation}) => {
  const {gameState, send, on, off} = useWebSocket();
  const [canStart, setCanStart] = useState(false);

  useEffect(() => {
    on('player_joined', handlePlayerJoined);
    on('player_left', handlePlayerLeft);
    on('game_start', handleGameStart);
    on('error', handleError);

    // 检查是否可以开始游戏
    if (gameState.opponentName) {
      setCanStart(true);
    }

    return () => {
      off('player_joined');
      off('player_left');
      off('game_start');
      off('error');
    };
  }, [gameState.opponentName]);

  const handlePlayerJoined = data => {
    setCanStart(true);
  };

  const handlePlayerLeft = data => {
    Alert.alert('提示', `${data.playerName} 离开了房间`, [
      {
        text: '确定',
        onPress: () => {
          send({type: 'leave_room'});
          navigation.navigate('Menu');
        },
      },
    ]);
  };

  const handleGameStart = data => {
    navigation.navigate('Game');
  };

  const handleError = data => {
    Alert.alert('错误', data.message);
  };

  const leaveRoom = () => {
    Alert.alert('提示', '确定要离开房间吗？', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '确定',
        onPress: () => {
          send({type: 'leave_room'});
          navigation.navigate('Menu');
        },
      },
    ]);
  };

  const startGame = () => {
    if (!canStart) {
      Alert.alert('提示', '等待对手加入');
      return;
    }
    send({type: 'start_game'});
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={leaveRoom}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>游戏房间</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.roomCodeCard}>
          <Text style={styles.roomCodeLabel}>房间号</Text>
          <Text style={styles.roomCode}>{gameState.roomCode || '------'}</Text>
        </View>

        <View style={styles.playersContainer}>
          <View style={styles.playerCard}>
            <View style={styles.playerAvatar}>
              <Text style={styles.playerAvatarText}>👤</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {gameState.playerName || '玩家1'}
              </Text>
              <Text style={styles.playerStatus}>已准备</Text>
            </View>
          </View>

          {gameState.opponentName ? (
            <View style={styles.playerCard}>
              <View style={styles.playerAvatar}>
                <Text style={styles.playerAvatarText}>👤</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{gameState.opponentName}</Text>
                <Text style={styles.playerStatus}>已准备</Text>
              </View>
            </View>
          ) : (
            <View style={styles.waitingCard}>
              <Text style={styles.waitingText}>等待对手加入...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.startButton, !canStart && styles.disabledButton]}
          onPress={startGame}
          disabled={!canStart || !gameState.isHost}>
          <LinearGradient
            colors={
              canStart && gameState.isHost
                ? ['#667eea', '#764ba2']
                : ['#ccc', '#999']
            }
            style={styles.buttonGradient}>
            <Text style={styles.buttonText}>
              {!gameState.isHost
                ? '等待房主开始'
                : canStart
                ? '开始游戏'
                : '等待对手'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  roomCodeCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roomCodeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  roomCode: {
    fontSize: 32,
    fontWeight: '900',
    color: '#667eea',
    letterSpacing: 4,
  },
  playersContainer: {
    padding: 16,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerAvatarText: {
    fontSize: 24,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  playerStatus: {
    fontSize: 14,
    color: '#28a745',
  },
  waitingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  waitingText: {
    fontSize: 16,
    color: '#999',
  },
  actions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  startButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RoomScreen;
