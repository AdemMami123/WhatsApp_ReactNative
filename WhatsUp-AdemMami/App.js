import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';

import Auth from './screens/Auth';
import NewAccount from './screens/NewAccount';
import Home from './screens/Home';
import Chat from './screens/Chat';
import Setting from './screens/Home/Setting';
import CreateGroup from './screens/CreateGroup';
import GroupChat from './screens/GroupChat';
import GroupDetails from './screens/GroupDetails';
import CallScreen from './screens/CallScreen';

import firebase from './Config';

LogBox.ignoreLogs([
  'Setting a timer',
  'AsyncStorage has been extracted',
  'Non-serializable values were found in the navigation state',
]);

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const database = firebase.database();
    const connectedRef = database.ref('.info/connected');

    const handleConnectionChange = (snapshot) => {
      if (snapshot.val() === true) {
        console.log('Connected to Firebase');
      } else {
        console.log('Disconnected from Firebase');
      }
    };

    connectedRef.on('value', handleConnectionChange);

    return () => {
      connectedRef.off('value', handleConnectionChange);
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={Auth} />
        <Stack.Screen
          name="NewAccount"
          component={NewAccount}
          options={{
            headerShown: true,
            headerTitle: "Back to Auth"
          }}
        />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen
          name="Chat"
          component={Chat}
          options={{
            headerShown: false
          }}
        />
        <Stack.Screen name="Setting" component={Setting} />
        <Stack.Screen
          name="CreateGroup"
          component={CreateGroup}
        />
        <Stack.Screen
          name="GroupChat"
          component={GroupChat}
        />
        <Stack.Screen
          name="GroupDetails"
          component={GroupDetails}
        />
        <Stack.Screen
          name="CallScreen"
          component={CallScreen}
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: 'fade'
          }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
