import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, StatusBar, ImageBackground } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import firebase from '../Config';
import { Button, Avatar, Menu, Provider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import CallService from '../services/CallService';
import { requestMicrophonePermission } from '../utils/CallUtils';
import IncomingCallNotification from '../components/IncomingCallNotification';

const database = firebase.database();
const ref_database = database.ref();
const ref_groups = ref_database.child("Groups");
const ref_groupMessages = ref_database.child("GroupMessages");
const ref_groupMembers = ref_database.child("GroupMembers");
const ref_listcomptes = ref_database.child("ListComptes");

export default function GroupChat({ route, navigation }) {
  const currentUserId = route.params?.currentUserId;
  const groupId = route.params?.groupId;

  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);
  const [groupMembers, setGroupMembers] = useState({});
  const [userDetails, setUserDetails] = useState({});

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');

  const flatListRef = useRef(null);

  // Handle call status changes
  const handleCallStatusChanged = (status, user) => {
    setCallStatus(status);

    if (status === 'incoming' && user) {
      setIncomingCall({
        id: user.id,
        name: user.name,
        avatar: user.avatar
      });
    } else if (status === 'idle') {
      setIncomingCall(null);
    }
  };

  // Initialize call service
  useEffect(() => {
    if (currentUserId) {
      // Initialize call service with current user
      const currentUser = {
        id: currentUserId,
        name: currentUserName || 'You'
      };

      CallService.initialize(currentUser, handleCallStatusChanged);

      // Clean up on unmount
      return () => {
        CallService.cleanup();
      };
    }
  }, [currentUserId, currentUserName]);

  // Handle group audio call button press
  const handleGroupAudioCall = async () => {
    // Request microphone permission
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Microphone permission is required for audio calls.');
      return;
    }

    // For group calls, we'll use the group info as the remote user
    // In a real implementation, this would initiate a call to all group members
    navigation.navigate('CallScreen', {
      callType: 'audio',
      remoteUser: {
        id: groupId,
        name: groupInfo?.name || 'Group',
        avatar: null,
        isGroup: true
      },
      isIncoming: false
    });
  };

  useEffect(() => {
    if (!currentUserId || !groupId) {
      Alert.alert('Error', 'Missing user or group information');
      navigation.goBack();
      return;
    }

    // Get current user details
    ref_listcomptes.child(currentUserId).once('value')
      .then(snapshot => {
        if (snapshot.exists()) {
          setCurrentUserName(snapshot.val().pseudo || 'User');
        }
      });

    // Get group info
    const groupInfoListener = ref_groups.child(groupId).on('value', snapshot => {
      if (snapshot.exists()) {
        const groupData = snapshot.val();
        setGroupInfo(groupData);

        // Set navigation header
        navigation.setOptions({
          headerShown: true,
          headerStyle: {
            backgroundColor: '#075e54',
          },
          headerTintColor: '#fff',
          headerTitle: () => (
            <TouchableOpacity
              style={styles.headerTitle}
              onPress={() => navigation.navigate('GroupDetails', { currentUserId, groupId })}
            >
              <Avatar.Text
                size={40}
                label={groupData.name ? groupData.name.charAt(0).toUpperCase() : 'G'}
                color="#fff"
                backgroundColor="#128C7E"
                style={styles.headerAvatar}
              />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitleText}>{groupData.name || 'Group'}</Text>
                <Text style={styles.headerSubtitle}>
                  {Object.keys(groupMembers).length} members
                </Text>
              </View>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton
                icon="phone"
                iconColor="#fff"
                size={22}
                onPress={handleGroupAudioCall}
              />
              <IconButton
                icon="dots-vertical"
                iconColor="#fff"
                size={22}
                onPress={() => navigation.navigate('GroupDetails', { currentUserId, groupId })}
              />
            </View>
          )
        });
      }
    });

    // Get group members
    const groupMembersListener = ref_groupMembers.child(groupId).on('value', async snapshot => {
      if (snapshot.exists()) {
        const members = snapshot.val();
        setGroupMembers(members);

        // Fetch details for all members
        const memberIds = Object.keys(members).filter(id => members[id] === true);
        const memberPromises = memberIds.map(memberId => {
          return ref_listcomptes.child(memberId).once('value')
            .then(userSnapshot => {
              if (userSnapshot.exists()) {
                return { id: memberId, ...userSnapshot.val() };
              }
              return null;
            });
        });

        const memberDetails = await Promise.all(memberPromises);
        const validMembers = memberDetails.filter(member => member !== null);

        const membersMap = {};
        validMembers.forEach(member => {
          membersMap[member.id] = member;
        });

        setUserDetails(membersMap);
      }
    });

    // Get messages
    const messagesListener = ref_groupMessages.child(groupId).on('value', snapshot => {
      if (snapshot.exists()) {
        const messagesData = [];
        snapshot.forEach(childSnapshot => {
          messagesData.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });

        // Sort messages by timestamp
        messagesData.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesData);

        // Scroll to bottom
        setTimeout(() => {
          if (flatListRef.current && messagesData.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    });

    return () => {
      ref_groups.child(groupId).off('value', groupInfoListener);
      ref_groupMembers.child(groupId).off('value', groupMembersListener);
      ref_groupMessages.child(groupId).off('value', messagesListener);
    };
  }, [currentUserId, groupId, navigation]);

  const handleSend = () => {
    if (msg.trim() === '') return;

    const messageData = {
      sender: currentUserId,
      senderName: currentUserName,
      text: msg,
      timestamp: Date.now(),
    };

    ref_groupMessages.child(groupId).push(messageData)
      .then(() => {
        console.log('Message sent successfully');
        setMsg('');
      })
      .catch(error => {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message: ' + error.message);
      });
  };

  const handleLongPress = (message) => {
    if (message.sender === currentUserId) {
      setSelectedMessage(message);
      setMenuVisible(true);
    }
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedMessage(null);
  };

  const deleteMessage = () => {
    if (selectedMessage) {
      ref_groupMessages.child(groupId).child(selectedMessage.id).remove()
        .then(() => {
          console.log('Message deleted successfully');
          closeMenu();
        })
        .catch(error => {
          console.error('Error deleting message:', error);
          Alert.alert('Error', 'Failed to delete message: ' + error.message);
        });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to change the chat background.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender === currentUserId;
    const isSelected = selectedMessage && selectedMessage.id === item.id;
    const sender = userDetails[item.sender];

    return (
      <TouchableOpacity
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
        disabled={!isCurrentUser}
      >
        <View style={styles.messageRow}>
          {!isCurrentUser && (
            <Avatar.Text
              size={30}
              label={sender?.pseudo ? sender.pseudo.charAt(0).toUpperCase() : '?'}
              style={styles.messageAvatar}
              color="#fff"
              backgroundColor="#128C7E"
            />
          )}
          <View
            style={[
              styles.messageBubble,
              isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
              isSelected && styles.selectedMessage
            ]}
          >
            {!isCurrentUser && (
              <Text style={styles.messageSender}>
                {sender?.pseudo || item.senderName || 'User'}
              </Text>
            )}
            <Text style={styles.messageText}>{item.text}</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.timestampText}>
                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </View>
          </View>
          {isCurrentUser && <View style={styles.spacer} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Provider>
      <StatusBar backgroundColor="#075e54" barStyle="light-content" />
      {incomingCall && (
        <IncomingCallNotification
          caller={incomingCall}
          onAccept={() => setIncomingCall(null)}
          onReject={() => setIncomingCall(null)}
        />
      )}
      <ImageBackground
        source={selectedImage ? { uri: selectedImage } : require("../assets/walpaper.jpg")}
        style={styles.container}
        imageStyle={styles.backgroundImage}
      >
        <SafeAreaView style={styles.innerContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={{ x: 0, y: 0 }}
            style={styles.menu}
          >
            <Menu.Item
              onPress={deleteMessage}
              title="Delete message"
              leadingIcon="delete"
            />
          </Menu>

          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => {
              if (flatListRef.current && messages.length > 0) {
                flatListRef.current.scrollToEnd({ animated: false });
              }
            }}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.inputContainer}
          >
            <View style={styles.inputWrapper}>
              <IconButton
                icon="emoticon"
                iconColor="#767676"
                size={24}
                style={styles.inputIcon}
                onPress={() => {}}
              />
              <TextInput
                placeholder="Message"
                value={msg}
                onChangeText={setMsg}
                style={styles.input}
                placeholderTextColor="#888"
              />
              <IconButton
                icon="paperclip"
                iconColor="#767676"
                size={24}
                style={styles.inputIcon}
                onPress={() => {}}
              />
              <IconButton
                icon="camera"
                iconColor="#767676"
                size={24}
                style={styles.inputIcon}
                onPress={pickImage}
              />
            </View>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              disabled={msg.trim() === ''}
            >
              <MaterialCommunityIcons
                name="send"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.8,
  },
  innerContainer: {
    flex: 1,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    marginRight: 10,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerTitleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
  },
  messageList: {
    padding: 10,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 3,
    alignItems: 'flex-end',
  },
  messageAvatar: {
    marginRight: 5,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 10,
    elevation: 1,
  },
  currentUserMessage: {
    backgroundColor: '#dcf8c6',
    marginLeft: 'auto',
    borderTopRightRadius: 0,
  },
  otherUserMessage: {
    backgroundColor: '#fff',
    marginRight: 'auto',
    borderTopLeftRadius: 0,
  },
  selectedMessage: {
    backgroundColor: '#b7f0a5',
  },
  messageSender: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#075e54',
    marginBottom: 3,
  },
  messageText: {
    fontSize: 16,
    color: '#303030',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
    alignItems: 'center',
  },
  timestampText: {
    fontSize: 11,
    color: '#7f8c8d',
    marginRight: 5,
  },
  spacer: {
    width: 35,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  inputIcon: {
    margin: 0,
  },
  sendButton: {
    backgroundColor: '#075e54',
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  menu: {
    marginTop: 50,
  },
});
