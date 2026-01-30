import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useWebSocket} from '../context/WebSocketContext';

const {width} = Dimensions.get('window');

const MenuScreen = ({navigation}) => {
  const {isConnected, send, on, off, updateGameState} = useWebSocket();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [matchingModalVisible, setMatchingModalVisible] = useState(false);
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');

  React.useEffect(() => {
    on('room_created', handleRoomCreated);
    on('room_joined', handleRoomJoined);
    on('match_found', handleMatchFound);
    on('error', handleError);

    return () => {
      off('room_created');
      off('room_joined');
      off('match_found');
      off('error');
    };
  }, []);

  const handleRoomCreated = data => {
    setCreateModalVisible(false);
    navigation.navigate('Room');
  };

  const handleRoomJoined = data => {
    setJoinModalVisible(false);
    navigation.navigate('Room');
  };

  const handleMatchFound = data => {
    setMatchingModalVisible(false);
    navigation.navigate('Room');
  };

  const handleError = data => {
    Alert.alert('错误', data.message);
    setMatchingModalVisible(false);
  };

  const createRoom = () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }
    send({type: 'create_room', nickname: nickname.trim()});
    updateGameState({playerName: nickname.trim()});
  };

  const joinRoom = () => {
    if (!roomCode.trim() || roomCode.length !== 6) {
      Alert.alert('提示', '请输入正确的6位房间号');
      return;
    }
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }
    send({
      type: 'join_room',
      roomCode: roomCode.trim(),
      nickname: nickname.trim(),
    });
    updateGameState({playerName: nickname.trim()});
  };

  const randomMatch = () => {
    const randomNickname = '玩家' + Math.floor(Math.random() * 10000);
    send({type: 'random_match', nickname: randomNickname});
    updateGameState({playerName: randomNickname});
    setMatchingModalVisible(true);
  };

  const cancelMatching = () => {
    send({type: 'leave_room'});
    setMatchingModalVisible(false);
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>💎 消消乐</Text>
        <Text style={styles.subtitle}>多人实时对战</Text>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              {backgroundColor: isConnected ? '#28a745' : '#dc3545'},
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected ? '已连接' : '未连接'}
          </Text>
        </View>
      </View>

      <View style={styles.menuButtons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setCreateModalVisible(true)}
          disabled={!isConnected}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.buttonGradient}>
            <Text style={styles.buttonText}>创建房间</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setJoinModalVisible(true)}
          disabled={!isConnected}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            style={styles.buttonGradient}>
            <Text style={styles.buttonText}>加入房间</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={randomMatch}
          disabled={!isConnected}>
          <Text style={styles.outlineButtonText}>随机匹配</Text>
        </TouchableOpacity>
      </View>

      {/* 创建房间弹窗 */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>创建房间</Text>
            <TextInput
              style={styles.input}
              placeholder="输入昵称"
              placeholderTextColor="#999"
              value={nickname}
              onChangeText={setNickname}
              maxLength={12}
            />
            <TouchableOpacity
              style={[styles.button, styles.modalButton]}
              onPress={createRoom}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.buttonGradient}>
                <Text style={styles.buttonText}>创建</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={() => setCreateModalVisible(false)}>
              <Text style={styles.outlineButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 加入房间弹窗 */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>加入房间</Text>
            <TextInput
              style={styles.input}
              placeholder="输入6位房间号"
              placeholderTextColor="#999"
              value={roomCode}
              onChangeText={setRoomCode}
              maxLength={6}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="输入昵称"
              placeholderTextColor="#999"
              value={nickname}
              onChangeText={setNickname}
              maxLength={12}
            />
            <TouchableOpacity
              style={[styles.button, styles.modalButton]}
              onPress={joinRoom}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.buttonGradient}>
                <Text style={styles.buttonText}>加入</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={() => setJoinModalVisible(false)}>
              <Text style={styles.outlineButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 匹配中弹窗 */}
      <Modal
        visible={matchingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelMatching}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>匹配中</Text>
            <Text style={styles.matchingText}>正在寻找对手...</Text>
            <TouchableOpacity
              style={[styles.button, styles.outlineButton]}
              onPress={cancelMatching}>
              <Text style={styles.outlineButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
  menuButtons: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
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
  outlineButton: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: width * 0.85,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  modalButton: {
    marginBottom: 8,
  },
  matchingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
});

export default MenuScreen;
