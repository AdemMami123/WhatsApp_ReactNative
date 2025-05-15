import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CallService from '../services/CallService';

const { width } = Dimensions.get('window');

const IncomingCallNotification = ({ caller, onAccept, onReject }) => {
  const navigation = useNavigation();
  const [slideAnim] = useState(new Animated.Value(-100));
  
  useEffect(() => {
    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Auto dismiss after 30 seconds
    const timeout = setTimeout(() => {
      handleReject();
    }, 30000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  const handleAccept = () => {
    if (onAccept) onAccept();
    
    // Navigate to call screen
    navigation.navigate('CallScreen', {
      callType: 'audio',
      remoteUser: caller,
      isIncoming: true,
    });
  };
  
  const handleReject = () => {
    // Slide out animation
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onReject) onReject();
    });
    
    // Reject the call
    CallService.rejectCall();
  };
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY: slideAnim }] },
        Platform.OS === 'ios' ? styles.iosContainer : {}
      ]}
    >
      <View style={styles.callerInfo}>
        {caller.avatar ? (
          <Avatar.Image 
            source={{ uri: caller.avatar }} 
            size={50} 
            style={styles.avatar}
          />
        ) : (
          <Avatar.Text 
            size={50} 
            label={caller.name.charAt(0).toUpperCase()} 
            style={styles.avatar}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={styles.callerName}>{caller.name}</Text>
          <Text style={styles.callType}>Incoming audio call</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]} 
          onPress={handleReject}
        >
          <MaterialCommunityIcons name="phone-hangup" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]} 
          onPress={handleAccept}
        >
          <MaterialCommunityIcons name="phone" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#075e54',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 1000,
  },
  iosContainer: {
    paddingTop: 50, // Account for iOS status bar
  },
  callerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 10,
    backgroundColor: '#128C7E',
  },
  textContainer: {
    flex: 1,
  },
  callerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  callType: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: '#25D366',
  },
  rejectButton: {
    backgroundColor: '#FF0000',
  },
});

export default IncomingCallNotification;
