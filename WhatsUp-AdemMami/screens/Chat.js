import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import firebase from '../Config';
import { Button, Avatar, Menu, Provider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const database = firebase.database();
const ref_database = database.ref();
const ref_lesdiscussions = ref_database.child("LesDiscussions");
const ref_listcomptes = ref_database.child("ListComptes");

export default function Chat({ route, navigation }) {
  // Get user IDs from route params
  const currentUserId = route.params?.currentUserId;
  const secondUserId = route.params?.secondUserId;
  
  // State for messages and user data
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [secondUserName, setSecondUserName] = useState('');
  
  // State for message options menu
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  // Create a unique discussion ID
  const idDesc = currentUserId > secondUserId ? 
    currentUserId + secondUserId : 
    secondUserId + currentUserId;
  
  const ref_undiscussion = ref_lesdiscussions.child(idDesc);
  
  // Fetch user names from database
  useEffect(() => {
    // Fetch current user info
    if (currentUserId) {
      ref_listcomptes.child(currentUserId).once('value')
        .then(snapshot => {
          if (snapshot.exists()) {
            setCurrentUserName(snapshot.val().pseudo || 'You');
          }
        });
    }
    
    // Fetch second user info
    if (secondUserId) {
      ref_listcomptes.child(secondUserId).once('value')
        .then(snapshot => {
          if (snapshot.exists()) {
            setSecondUserName(snapshot.val().pseudo || 'Other User');
            // Set the title of the navigation header
            navigation.setOptions({
              title: snapshot.val().pseudo || 'Chat',
              headerShown: true
            });
          }
        });
    }
    
    // Define the listener callback
    const messageListenerCallback = snapshot => {
      const messageList = [];
      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          messageList.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Sort messages by timestamp
        messageList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messageList);
      } else {
        // If the discussion node doesn't exist or is empty, clear local messages.
        setMessages([]);
      }
    };
    
    // Attach the listener
    ref_undiscussion.on('value', messageListenerCallback);
    
    // Clean up listeners
    return () => {
      // Detach the specific listener
      ref_undiscussion.off('value', messageListenerCallback);
    };
  }, [currentUserId, secondUserId, navigation, ref_undiscussion]); // Added ref_undiscussion to dependencies
  
  // Send message function
  const handleSend = () => {
    if (msg.trim() === '') return;
    
    const messageData = {
      sender: currentUserId,
      text: msg,
      timestamp: Date.now()
    };
    
    ref_undiscussion.push(messageData)
      .then(() => {
        console.log('Message sent successfully');
        setMsg(''); // Clear input after sending
      })
      .catch(error => {
        console.error('Error sending message:', error);
        alert('Failed to send message: ' + error.message);
      });
  };

  // Handle long press on a message
  const handleLongPress = (message) => {
    if (message.sender === currentUserId) {
      setSelectedMessage(message);
      setMenuVisible(true);
    }
  };

  // Close menu
  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedMessage(null);
  };

  // Delete message function
  const deleteMessage = () => {
    if (!selectedMessage) return;
    
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: closeMenu
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Delete the message from Firebase
            const messageRef = ref_undiscussion.child(selectedMessage.id);
            messageRef.remove()
              .then(() => {
                console.log('Message deleted successfully');
                closeMenu();
              })
              .catch(error => {
                console.error('Error deleting message:', error);
                alert('Failed to delete message: ' + error.message);
                closeMenu();
              });
          }
        }
      ]
    );
  };
  
  // Render individual message item
  const renderMessage = ({ item }) => {
    const isCurrentUser = item.sender === currentUserId;
    const isSelected = selectedMessage && selectedMessage.id === item.id;
    
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
              label={secondUserName.charAt(0)} 
              style={styles.messageAvatar} 
            />
          )}
          <View 
            style={[
              styles.messageBubble, 
              isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
              isSelected && styles.selectedMessage
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.timestampText}>
              {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
          {isCurrentUser && <View style={styles.spacer} />}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <Provider>
      <SafeAreaView style={styles.container}>
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
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
        />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <TextInput
            placeholder="Type your message..."
            value={msg}
            onChangeText={setMsg}
            style={styles.input}
          />
          <Button 
            mode="contained" 
            onPress={handleSend}
            style={styles.sendButton}
          >
            Send
          </Button>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6974d6',
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  avatar: {
    marginRight: 10,
    backgroundColor: '#fff',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageList: {
    padding: 15,
    paddingBottom: 70,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
    width: '100%',
  },
  messageAvatar: {
    marginRight: 5,
    backgroundColor: '#6974d6',
  },
  spacer: {
    width: 35, // Same width as avatar to balance the layout
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 0,
    marginLeft: 'auto', // Push to the right side
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 0,
    marginRight: 'auto', // Push to the left side
  },
  selectedMessage: {
    backgroundColor: '#b7f0a1', // Highlight color when selected
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timestampText: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
    marginRight: 10,
  },
  sendButton: {
    borderRadius: 20,
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    top: 50,
    left: 50,
  },
});