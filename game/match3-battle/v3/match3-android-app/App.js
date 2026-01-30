import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {StatusBar} from 'react-native';

import MenuScreen from './src/screens/MenuScreen';
import RoomScreen from './src/screens/RoomScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import {WebSocketProvider} from './src/context/WebSocketContext';

const Stack = createStackNavigator();

const App = () => {
  return (
    <WebSocketProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#667eea" />
        <Stack.Navigator
          initialRouteName="Menu"
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
          }}>
          <Stack.Screen name="Menu" component={MenuScreen} />
          <Stack.Screen name="Room" component={RoomScreen} />
          <Stack.Screen name="Game" component={GameScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </WebSocketProvider>
  );
};

export default App;
