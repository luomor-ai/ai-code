import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useWebSocket} from '../context/WebSocketContext';

const ResultScreen = ({navigation, route}) => {
  const {myScore, opponentScore, myName, opponentName} = route.params;
  const {send, resetGameState} = useWebSocket();
  const isWin = myScore > opponentScore;

  const backToMenu = () => {
    send({type: 'leave_room'});
    resetGameState();
    navigation.navigate('Menu');
  };

  return (
    <LinearGradient
      colors={isWin ? ['#28a745', '#20c997'] : ['#dc3545', '#c82333']}
      style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.resultTitle}>{isWin ? '🏆 胜利!' : '😢 失败'}</Text>

        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.playerName}>{myName}</Text>
            <Text style={styles.playerScore}>{myScore}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.scoreRow}>
            <Text style={styles.playerName}>{opponentName}</Text>
            <Text style={styles.playerScore}>{opponentScore}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={backToMenu}>
          <View style={styles.buttonInner}>
            <Text style={styles.buttonText}>返回主菜单</Text>
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  resultTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 40,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  playerScore: {
    fontSize: 18,
    fontWeight: '700',
    color: '#667eea',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonInner: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ResultScreen;
