import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import firebase from '../Config';
import { Button, Avatar, Menu, Provider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const database = firebase.database();
const ref_database = database.ref();
const ref_lesdiscussions = ref_database.child("LesDiscussions");
const ref_listcomptes = ref_database.child("ListComptes");

// my message status 
const MessageStatus = ({ status }) => {
  let iconName = "check";
  let iconColor = "#bbb";
  
  if (status === "delivered") {
    iconName = "check-all";
    iconColor = "#bbb";
  } else if (status === "read") {
    iconName = "check-all";
    iconColor = "#5cb3ff";
  }
  
  return <MaterialCommunityIcons name={iconName} size={14} color={iconColor} />;
};

export default function Chat({ route, navigation }) {
  const currentUserId = route.params?.currentUserId;
  const secondUserId = route.params?.secondUserId;
  
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');
  const [currentUserName, setCurrentUserName] = useState('');
  const [secondUserName, setSecondUserName] = useState('');
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  const idDesc = currentUserId > secondUserId ? 
    currentUserId + secondUserId : 
    secondUserId + currentUserId;
  
  const ref_undiscussion = ref_lesdiscussions.child(idDesc);
  
  useEffect(() => {
    if (currentUserId) {
      ref_listcomptes.child(currentUserId).once('value')
        .then(snapshot => {
          if (snapshot.exists()) {
            setCurrentUserName(snapshot.val().pseudo || 'You');
          }
        });
    }
    
    if (secondUserId) {
      ref_listcomptes.child(secondUserId).once('value')
        .then(snapshot => {
          if (snapshot.exists()) {
            setSecondUserName(snapshot.val().pseudo || 'Other User');
            navigation.setOptions({
              title: snapshot.val().pseudo || 'Chat',
              headerShown: true
            });
          }
        });
    }
    
    const messageListenerCallback = snapshot => {
      const messageList = [];
      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          messageList.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        messageList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messageList);
      } else {
        setMessages([]);
      }
    };
    
    ref_undiscussion.on('value', messageListenerCallback);
    
    return () => {
      ref_undiscussion.off('value', messageListenerCallback);
    };
  }, [currentUserId, secondUserId, navigation, ref_undiscussion]);
  
  const handleSend = () => {
    if (msg.trim() === '') return;
    
    const messageData = {
      sender: currentUserId,
      text: msg,
      timestamp: Date.now(),
      status: "sent"
    };
    
    ref_undiscussion.push(messageData)
      .then(() => {
        console.log('Message sent successfully');
        setMsg('');
      })
      .catch(error => {
        console.error('Error sending message:', error);
        alert('Failed to send message: ' + error.message);
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
            {isCurrentUser && <MessageStatus status={item.status} />}
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
    width: 35,
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
    marginLeft: 'auto',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 0,
    marginRight: 'auto',
  },
  selectedMessage: {
    backgroundColor: '#b7f0a1',
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