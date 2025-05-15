import React, { useEffect, useState } from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import ListUsers from './Home/ListUsers';
import Setting from './Home/Setting';
import Contacts from './Home/Contacts';
import Groups from './Home/Groups';
import firebase from '../Config';

const auth = firebase.auth();
const database = firebase.database();
const ref_listcomptes = database.ref("ListComptes");
const Tab = createMaterialBottomTabNavigator();

export default function Home({ route, navigation }) {
  const currentUserId = route.params?.currentUserId;
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!currentUserId) {
      console.error("No currentUserId provided");
      setIsLoading(false);
      return;
    }

    const syncCurrentUserToListComptes = async () => {
      try {
        const listComptesSnapshot = await ref_listcomptes.once('value');
        const existingEntries = listComptesSnapshot.val() || {};

        if (!existingEntries[currentUserId]) {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await ref_listcomptes.child(currentUserId).set({
              id: currentUserId,
              email: currentUser.email,
              pseudo: currentUser.email ? currentUser.email.split('@')[0] : 'User',
              numero: ''
            });
          }
        } else {
          // Get current user data
          setCurrentUser(existingEntries[currentUserId]);
        }
      } catch (error) {
        console.error("Error syncing current user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    syncCurrentUserToListComptes();

    // Set header title to WhatsUp
    navigation.setOptions({
      headerShown: true,
      title: "WhatsUp",
      headerStyle: {
        backgroundColor: '#075e54',
      },
      headerTitleStyle: {
        color: '#fff',
        fontWeight: 'bold',
      },
      headerRight: () => (
        <View style={styles.headerRight}>
          <MaterialCommunityIcons
            name="magnify"
            size={24}
            color="#fff"
            style={styles.headerIcon}
            onPress={() => {}}
          />
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color="#fff"
            style={styles.headerIcon}
            onPress={() => {}}
          />
        </View>
      ),
    });
  }, [currentUserId, navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="#075e54" barStyle="light-content" />
      <Tab.Navigator
        initialRouteName="Users"
        activeColor="#fff"
        inactiveColor="#e0e0e0"
        barStyle={styles.tabBar}
        shifting={true}
      >
        <Tab.Screen
          name="Users"
          component={ListUsers}
          initialParams={{ currentUserId }}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="chat" color={color} size={24} />
            ),
            tabBarColor: '#075e54',
          }}
        />
        <Tab.Screen
          name="Groups"
          component={Groups}
          initialParams={{ currentUserId }}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="account-multiple" color={color} size={24} />
            ),
            tabBarColor: '#075e54',
          }}
        />
        <Tab.Screen
          name="Contacts"
          component={Contacts}
          initialParams={{ currentUserId }}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="account-box-multiple" color={color} size={24} />
            ),
            tabBarColor: '#075e54',
          }}
        />
        <Tab.Screen
          name="Settings"
          component={Setting}
          initialParams={{ currentUserId }}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="cog" color={color} size={24} />
            ),
            tabBarColor: '#075e54',
          }}
        />
      </Tab.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  tabBar: {
    backgroundColor: '#075e54',
    height: 60,
    paddingBottom: 5,
  },
  headerRight: {
    flexDirection: 'row',
    marginRight: 10,
  },
  headerIcon: {
    marginHorizontal: 10,
  }
});