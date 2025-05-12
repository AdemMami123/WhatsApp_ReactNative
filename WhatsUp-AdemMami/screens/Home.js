import React, { useEffect, useState } from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import ListUsers from './Home/ListUsers';
import Setting from './Home/Setting';
import Contacts from './Home/Contacts';
import firebase from '../Config';

const auth = firebase.auth();
const database = firebase.database();
const ref_listcomptes = database.ref("ListComptes");
const Tab = createMaterialBottomTabNavigator();

export default function Home({ route }) {
  const currentUserId = route.params?.currentUserId;
  const [isLoading, setIsLoading] = useState(true);

  console.log("[Home.js] Received currentUserId:", currentUserId);

  useEffect(() => {
    if (!currentUserId) {
      console.error("[Home.js] No currentUserId provided");
      setIsLoading(false);
      return;
    }

    const syncCurrentUserToListComptes = async () => {
      console.log("[Home.js] Starting sync of current user with ListComptes");
      try {
        // First, get all existing entries in ListComptes
        const listComptesSnapshot = await ref_listcomptes.once('value');
        const existingEntries = listComptesSnapshot.val() || {};
        console.log("[Home.js] Existing entries in ListComptes:", Object.keys(existingEntries));

        // Make sure current user has an entry
        if (!existingEntries[currentUserId]) {
          console.log("[Home.js] Creating missing entry for current user:", currentUserId);
          const currentUser = auth.currentUser;
          if (currentUser) {
            await ref_listcomptes.child(currentUserId).set({
              id: currentUserId,
              email: currentUser.email,
              pseudo: currentUser.email ? currentUser.email.split('@')[0] : 'User',
              numero: ''
            });
            console.log("[Home.js] Created entry for current user:", currentUserId);
          }
        } else {
          console.log("[Home.js] User already exists in ListComptes:", currentUserId);
        }
      } catch (error) {
        console.error("[Home.js] Error syncing current user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    syncCurrentUserToListComptes();
  }, [currentUserId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator barStyle={{ backgroundColor: '#6974d6' }}>
      <Tab.Screen 
        name="Users" 
        component={ListUsers} 
        initialParams={{ currentUserId }} 
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={Contacts}
        initialParams={{ currentUserId }}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="contacts" color={color} size={24} />
          ),
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
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  }
});