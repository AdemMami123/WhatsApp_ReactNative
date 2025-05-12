import React from 'react';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ListUsers from './Home/ListUsers';
import Setting from './Home/Setting';

const Tab = createMaterialBottomTabNavigator();

export default function Home({ route }) {
  // Get current user ID from route params
  const currentUserId = route.params?.currentUserId;
  
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