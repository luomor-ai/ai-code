import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useWebSocket} from '../context/WebSocketContext';

const {width} = Dimensions.get('window');
const BOARD_SIZE = 8;
const COLORS = 6;
const CELL_SIZE = (width - 48) / BOARD_SIZE;

const GEMS = ['💎', '💚', '⭐', '🔷', '❤️', '🟣'];
const GEM_COLORS = [
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
  '#f38181',
  '#aa96da',
];

const GameScreen = ({navigation}) => {
  const {gameState, send, on, off, updateGameState} = useWebSocket();
  const [board, setBoard] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [myScore, setMyScore] = useState(0);
  const [timer, setTimer] = useState(60);
  const [isGameActive, setIsGameActive] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    initializeBoard();
    setIsGameActive(true);
    startTimer();

    on('score_update', handleScoreUpdate);
    on('game_end', handleGameEnd);

    return () => {
      off('score_update');
      off('game_end');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const initializeBoard = () => {
    const newBoard = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      newBoard[i] = [];
      for (let j = 0; j < BOARD_SIZE; j++) {
        newBoard[i][j] = {
          color: Math.floor(Math.random() * COLORS),
          matched: false,
        };
      }
    }
    setBoard(newBoard);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleScoreUpdate = data => {
    // 对手分数已在 context 中更新
  };

  const handleGameEnd = data => {
    setIsGameActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    navigation.navigate('Result', {
      myScore: myScore,
      opponentScore: gameState.opponentScore,
      myName: gameState.playerName,
      opponentName: gameState.opponentName,
    });
  };

  const endGame = () => {
    setIsGameActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    send({type: 'game_end', score: myScore});
  };

  const selectCell = (row, col) => {
    if (!isGameActive) return;

    if (selectedCell === null) {
      setSelectedCell({row, col});
    } else {
      const {row: prevRow, col: prevCol} = selectedCell;
      const isAdjacent =
        Math.abs(row - prevRow) + Math.abs(col - prevCol) === 1;

      if (isAdjacent) {
        swapCells(prevRow, prevCol, row, col);
      }
      setSelectedCell(null);
    }
  };

  const swapCells = (row1, col1, row2, col2) => {
    const newBoard = board.map(row => [...row]);
    const temp = newBoard[row1][col1];
    newBoard[row1][col1] = newBoard[row2][col2];
    newBoard[row2][col2] = temp;
    setBoard(newBoard);

    setTimeout(() => {
      if (checkMatches(newBoard)) {
        processMatches(newBoard);
      } else {
        // 交换回来
        const revertBoard = newBoard.map(row => [...row]);
        const temp = revertBoard[row1][col1];
        revertBoard[row1][col1] = revertBoard[row2][col2];
        revertBoard[row2][col2] = temp;
        setBoard(revertBoard);
      }
    }, 200);
  };

  const checkMatches = currentBoard => {
    let hasMatch = false;
    const matchBoard = currentBoard.map(row =>
      row.map(cell => ({...cell, matched: false})),
    );

    // 检查横向
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE - 2; j++) {
        const color = matchBoard[i][j].color;
        if (
          color === matchBoard[i][j + 1].color &&
          color === matchBoard[i][j + 2].color
        ) {
          matchBoard[i][j].matched = true;
          matchBoard[i][j + 1].matched = true;
          matchBoard[i][j + 2].matched = true;
          hasMatch = true;
        }
      }
    }

    // 检查纵向
    for (let i = 0; i < BOARD_SIZE - 2; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const color = matchBoard[i][j].color;
        if (
          color === matchBoard[i + 1][j].color &&
          color === matchBoard[i + 2][j].color
        ) {
          matchBoard[i][j].matched = true;
          matchBoard[i + 1][j].matched = true;
          matchBoard[i + 2][j].matched = true;
          hasMatch = true;
        }
      }
    }

    if (hasMatch) {
      setBoard(matchBoard);
    }
    return hasMatch;
  };

  const processMatches = currentBoard => {
    let score = 0;
    const processedBoard = currentBoard.map(row => [...row]);

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (processedBoard[i][j].matched) {
          score += 10;
        }
      }
    }

    setMyScore(prev => {
      const newScore = prev + score;
      send({type: 'score_update', score: newScore});
      updateGameState({myScore: newScore});
      return newScore;
    });

    setTimeout(() => {
      fillBoard(processedBoard);
    }, 300);
  };

  const fillBoard = currentBoard => {
    const newBoard = currentBoard.map(row => [...row]);

    for (let j = 0; j < BOARD_SIZE; j++) {
      let emptyCount = 0;

      for (let i = BOARD_SIZE - 1; i >= 0; i--) {
        if (newBoard[i][j].matched) {
          emptyCount++;
        } else if (emptyCount > 0) {
          newBoard[i + emptyCount][j] = {...newBoard[i][j]};
        }
      }

      for (let i = 0; i < emptyCount; i++) {
        newBoard[i][j] = {
          color: Math.floor(Math.random() * COLORS),
          matched: false,
        };
      }
    }

    setBoard(newBoard);

    setTimeout(() => {
      if (checkMatches(newBoard)) {
        processMatches(newBoard);
      }
    }, 300);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={styles.playerNameSmall}>{gameState.playerName}</Text>
          <Text style={styles.score}>{myScore}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>{timer}</Text>
        </View>
        <View style={[styles.scoreContainer, styles.scoreRight]}>
          <Text style={styles.playerNameSmall}>{gameState.opponentName}</Text>
          <Text style={styles.score}>{gameState.opponentScore}</Text>
        </View>
      </LinearGradient>

      <View style={styles.boardContainer}>
        <View style={styles.board}>
          {board.map((row, i) =>
            row.map((cell, j) => (
              <TouchableOpacity
                key={`${i}-${j}`}
                style={[
                  styles.cell,
                  {backgroundColor: GEM_COLORS[cell.color]},
                  selectedCell?.row === i &&
                    selectedCell?.col === j &&
                    styles.selectedCell,
                  cell.matched && styles.matchedCell,
                ]}
                onPress={() => selectCell(i, j)}>
                <Text style={styles.gem}>{GEMS[cell.color]}</Text>
              </TouchableOpacity>
            )),
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 40,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreContainer: {
    flex: 1,
  },
  scoreRight: {
    alignItems: 'flex-end',
  },
  playerNameSmall: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    marginBottom: 4,
  },
  score: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  timerContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timer: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  board: {
    width: width - 32,
    height: width - 32,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cell: {
    width: CELL_SIZE - 8,
    height: CELL_SIZE - 8,
    margin: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCell: {
    borderWidth: 3,
    borderColor: '#667eea',
    transform: [{scale: 1.1}],
  },
  matchedCell: {
    opacity: 0.5,
  },
  gem: {
    fontSize: 24,
  },
});

export default GameScreen;
