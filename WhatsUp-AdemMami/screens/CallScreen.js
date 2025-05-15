import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Vibration,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar } from 'react-native-paper';
import CallService from '../services/CallService';

// Format call duration in MM:SS format
const formatCallDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Simple permission request function
const requestMicrophonePermission = async () => {
  // In a real app, we would check actual permissions
  // For now, just return true to simulate permission granted
  return true;
};

const CallScreen = ({ route, navigation }) => {
  const { callType, remoteUser, isIncoming = false } = route.params || {};

  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'connecting');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulse animation for the avatar
  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (callStatus === 'incoming' || callStatus === 'connecting' || callStatus === 'outgoing') {
          startPulseAnimation();
        }
      });
    };

    startPulseAnimation();

    // Vibration pattern for incoming calls
    if (callStatus === 'incoming') {
      const vibrationPattern = [1000, 2000, 1000];
      const vibrationInterval = setInterval(() => {
        Vibration.vibrate(vibrationPattern);
      }, 4000);

      return () => {
        clearInterval(vibrationInterval);
        Vibration.cancel();
      };
    }
  }, [callStatus, pulseAnim]);

  // Initialize call
  useEffect(() => {
    const initializeCall = async () => {
      // Request microphone permission
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        alert('Microphone permission is required for calls');
        navigation.goBack();
        return;
      }

      // Set up call status callback
      CallService.onCallStatusChanged = handleCallStatusChanged;
      CallService.onCallDurationChanged = handleCallDurationChanged;

      // Handle incoming or outgoing call
      if (isIncoming) {
        // Call is already initialized by the service
        setCallStatus('incoming');
      } else {
        // Start outgoing call
        try {
          await CallService.makeCall(remoteUser);
          setCallStatus('outgoing');
        } catch (error) {
          console.error('Failed to make call:', error);
          alert('Failed to make call. Please try again.');
          navigation.goBack();
        }
      }
    };

    initializeCall();

    // Clean up on unmount
    return () => {
      // Use the cleanup method to properly clean up resources
      CallService.cleanup();
    };
  }, [isIncoming, navigation, remoteUser]);

  // Handle call status changes
  const handleCallStatusChanged = (status, user) => {
    setCallStatus(status);

    if (status === 'idle') {
      // Call ended, navigate back
      navigation.goBack();
    }
  };

  // Handle call duration updates
  const handleCallDurationChanged = (newDuration) => {
    setDuration(newDuration);
  };

  // Answer incoming call
  const handleAnswerCall = async () => {
    try {
      await CallService.answerCall();
      setCallStatus('connected');
    } catch (error) {
      console.error('Failed to answer call:', error);
      alert('Failed to answer call. Please try again.');
      navigation.goBack();
    }
  };

  // Reject or end call
  const handleEndCall = async () => {
    try {
      if (callStatus === 'incoming') {
        await CallService.rejectCall();
      } else {
        await CallService.endCall();
      }
      navigation.goBack();
    } catch (error) {
      console.error('Failed to end call:', error);
      // Don't show an alert, just navigate back
      navigation.goBack();
    }
  };

  // Toggle mute
  const handleToggleMute = () => {
    const newMuteState = CallService.toggleMute();
    setIsMuted(newMuteState);
  };

  // Toggle speaker
  const handleToggleSpeaker = () => {
    const newSpeakerState = !isSpeakerOn;
    CallService.toggleSpeaker(newSpeakerState);
    setIsSpeakerOn(newSpeakerState);
  };

  // Render call status text
  const renderCallStatusText = () => {
    switch (callStatus) {
      case 'incoming':
        return 'Incoming call...';
      case 'outgoing':
        return 'Calling...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatCallDuration(duration);
      default:
        return '';
    }
  };

  // Get user avatar or initial
  const renderAvatar = () => {
    if (remoteUser?.avatar) {
      return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Image
            source={{ uri: remoteUser.avatar }}
            style={styles.avatar}
          />
        </Animated.View>
      );
    } else {
      return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Avatar.Text
            size={120}
            label={remoteUser?.name?.charAt(0).toUpperCase() || '?'}
            style={styles.avatarText}
            labelStyle={styles.avatarLabel}
          />
        </Animated.View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#075e54" />

      <View style={styles.userInfoContainer}>
        {renderAvatar()}
        <Text style={styles.userName}>{remoteUser?.name || 'Unknown'}</Text>
        <Text style={styles.callStatus}>{renderCallStatusText()}</Text>
      </View>

      <View style={styles.actionsContainer}>
        {callStatus === 'connected' && (
          <View style={styles.callControls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.activeControl]}
              onPress={handleToggleMute}
            >
              <MaterialCommunityIcons
                name={isMuted ? "microphone-off" : "microphone"}
                size={28}
                color="#fff"
              />
              <Text style={styles.controlText}>Mute</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isSpeakerOn && styles.activeControl]}
              onPress={handleToggleSpeaker}
            >
              <MaterialCommunityIcons
                name={isSpeakerOn ? "volume-high" : "volume-medium"}
                size={28}
                color="#fff"
              />
              <Text style={styles.controlText}>Speaker</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mainActions}>
          {callStatus === 'incoming' ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={handleEndCall}
              >
                <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={handleAnswerCall}
              >
                <MaterialCommunityIcons name="phone" size={32} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleEndCall}
            >
              <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#075e54',
  },
  userInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  avatarText: {
    backgroundColor: '#128C7E',
    marginBottom: 20,
  },
  avatarLabel: {
    fontSize: 50,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  callStatus: {
    fontSize: 18,
    color: '#e0e0e0',
  },
  actionsContainer: {
    paddingBottom: 50,
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  controlButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
  },
  activeControl: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  controlText: {
    color: '#fff',
    marginTop: 5,
  },
  mainActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  acceptButton: {
    backgroundColor: '#25D366',
  },
  declineButton: {
    backgroundColor: '#FF0000',
  },
});

export default CallScreen;

