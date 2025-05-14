import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, StatusBar } from 'react-native';
import React, { useState, useEffect } from 'react';
import firebase from '../Config';
import { Button, Avatar, Menu, Provider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageBackground } from 'react-native';

const database = firebase.database();
const ref_database = database.ref();
const ref_lesdiscussions = ref_database.child("LesDiscussions");
const ref_listcomptes = ref_database.child("ListComptes");

const MessageStatus = ({ status }) => {
  let iconName = "check";
  let iconColor = "#8696a0";
  
  if (status === "delivered") {
    iconName = "check-all";
    iconColor = "#8696a0";
  } else if (status === "read") {
    iconName = "check-all";
    iconColor = "#53bdeb";
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
  const [secondUserImage, setSecondUserImage] = useState('');
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const idDesc = currentUserId > secondUserId ? 
    currentUserId + secondUserId : 
    secondUserId + currentUserId;
  
  const ref_undiscussion = ref_lesdiscussions.child(idDesc);

  const pickImage = async () => {
    try {
      let permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert("Permission Needed", "Please allow access to your photos");
        return;
      }
      
      let picker = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
  
      if (!picker.canceled && picker.assets?.[0]?.uri) {
        setSelectedImage(picker.assets[0].uri);
      }
    } catch (err) {
      console.log("Image picker error:", err);
      Alert.alert("Error", "Failed to select image");
    }
  };
  
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
            setSecondUserImage(snapshot.val().image || '');
            
            navigation.setOptions({
              headerShown: true,
              headerStyle: {
                backgroundColor: '#075e54',
              },
              headerTintColor: '#fff',
              headerTitleAlign: 'left',
              headerTitle: () => (
                <View style={styles.headerContainer}>
                  <TouchableOpacity 
                    onPress={pickImage}
                    style={styles.headerAvatarContainer}
                  >
                    {secondUserImage ? (
                      <Image source={{ uri: secondUserImage }} style={styles.headerAvatar} />
                    ) : (
                      <Avatar.Text 
                        size={40} 
                        label={snapshot.val().pseudo.charAt(0).toUpperCase()} 
                        style={styles.headerAvatar}
                        labelStyle={{ fontSize: 18 }}
                        color="#fff"
                        backgroundColor="#128C7E"
                      />
                    )}
                    <View style={styles.imagePickerIcon}>
                      <MaterialCommunityIcons name="image-plus" size={16} color="#fff" />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>{snapshot.val().pseudo || 'Chat'}</Text>
                    <Text style={styles.headerSubtitle}>Online</Text>
                  </View>
                </View>
              ),
              headerRight: () => (
                <View style={styles.headerActions}>
                  <IconButton
                    icon="video"
                    iconColor="#fff"
                    size={22}
                    onPress={() => {}}
                  />
                  <IconButton
                    icon="phone"
                    iconColor="#fff"
                    size={22}
                    onPress={() => {}}
                  />
                  <IconButton
                    icon="dots-vertical"
                    iconColor="#fff"
                    size={22}
                    onPress={() => {}}
                  />
                </View>
              )
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
              label={secondUserName.charAt(0).toUpperCase()} 
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
            <Text style={styles.messageText}>{item.text}</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.timestampText}>
                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
              {isCurrentUser && <MessageStatus status={item.status} />}
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
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
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
              disabled={msg.trim().length === 0}
            >
              {msg.trim().length > 0 ? (
                <Ionicons name="send" size={20} color="#fff" />
              ) : (
                <MaterialCommunityIcons name="microphone" size={24} color="#fff" />
              )}
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
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    opacity: 0.5,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarContainer: {
    position: 'relative',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#128C7E',
  },
  imagePickerIcon: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: '#25D366',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#e0e0e0',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
  },
  messageList: {
    padding: 10,
    paddingBottom: 70,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 2,
    width: '100%',
  },
  messageAvatar: {
    marginRight: 5,
    backgroundColor: '#128C7E',
  },
  spacer: {
    width: 35,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 8,
    paddingVertical: 6,
    borderRadius: 7.5,
    minWidth: 80,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e7ffdb',
    borderTopRightRadius: 0,
    marginLeft: 'auto',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderTopLeftRadius: 0,
    marginRight: 'auto',
  },
  selectedMessage: {
    backgroundColor: '#dcf8c6',
  },
  messageText: {
    fontSize: 15,
    color: '#303030',
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  timestampText: {
    fontSize: 11,
    color: '#8696a0',
    marginRight: 4,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 0,
    fontSize: 16,
    color: '#303030',
  },
  inputIcon: {
    margin: 0,
    padding: 0,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#00a884',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    position: 'absolute',
    top: 50,
    left: 50,
  },
});