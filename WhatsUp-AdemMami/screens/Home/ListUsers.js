import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from "react-native";
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, FAB, Divider } from 'react-native-paper';
import firebase from "../../Config";

const database = firebase.database();
const ref_listcomptes = database.ref("ListComptes");
const ref_contacts = database.ref("Contacts");
const ref_lesdiscussions = database.ref("LesDiscussions");

export default function ListUsers({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;
  
  const [data, setData] = useState([]);
  const [userContacts, setUserContacts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [searchActive, setSearchActive] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const currentUserContactsRef = ref_contacts.child(currentUserId);
    const contactsListener = currentUserContactsRef.on('value', snapshot => {
      setUserContacts(snapshot.val() || {});
    });

    const usersListener = ref_listcomptes.on("value", async (snapshot) => {
      const filteredUsers = [];
      
      snapshot.forEach(un_compte => {
        const userData = un_compte.val();
        const userId = un_compte.key;
        
        if (userId !== currentUserId) {
          filteredUsers.push({ ...userData, id: userId });
        }
      });

      // Fetch last messages for each user
      const lastMsgsPromises = filteredUsers.map(user => {
        const idDesc = currentUserId > user.id ? 
          currentUserId + user.id : 
          user.id + currentUserId;
        
        return ref_lesdiscussions.child(idDesc)
          .orderByChild('timestamp')
          .limitToLast(1)
          .once('value')
          .then(snapshot => {
            if (snapshot.exists()) {
              let lastMsg = null;
              snapshot.forEach(msgSnap => {
                lastMsg = { id: msgSnap.key, ...msgSnap.val() };
              });
              return { userId: user.id, lastMessage: lastMsg };
            }
            return { userId: user.id, lastMessage: null };
          });
      });

      const lastMessagesResults = await Promise.all(lastMsgsPromises);
      const lastMessagesMap = {};
      lastMessagesResults.forEach(result => {
        if (result.lastMessage) {
          lastMessagesMap[result.userId] = result.lastMessage;
        }
      });

      setLastMessages(lastMessagesMap);
      
      // Sort users by last message timestamp (most recent first)
      filteredUsers.sort((a, b) => {
        const lastMsgA = lastMessagesMap[a.id];
        const lastMsgB = lastMessagesMap[b.id];
        
        if (!lastMsgA && !lastMsgB) return 0;
        if (!lastMsgA) return 1;
        if (!lastMsgB) return -1;
        
        return lastMsgB.timestamp - lastMsgA.timestamp;
      });
      
      setData(filteredUsers);
      setFilteredData(filteredUsers);
      setLoading(false);
    });

    return () => {
      if (currentUserId) {
        currentUserContactsRef.off('value', contactsListener);
      }
      ref_listcomptes.off("value", usersListener);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredData(data);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = data.filter(user => {
        const pseudo = (user.pseudo || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const numero = (user.numero || '').toLowerCase();
        
        return pseudo.includes(searchLower) || 
               email.includes(searchLower) || 
               numero.includes(searchLower);
      });
      setFilteredData(filtered);
    }
  }, [search, data]);

  // Function to format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // Same day, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    // Within the last week, show day name
    const daysDiff = (now - date) / (1000 * 60 * 60 * 24);
    if (daysDiff < 7) {
      return date.toLocaleDateString([], {weekday: 'short'});
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
  };
  
  // Function to truncate message text
  const truncateMessage = (text) => {
    if (!text) return '';
    return text.length > 30 ? text.substring(0, 30) + '...' : text;
  };

  const toggleContact = (contactId) => {
    if (!currentUserId || !contactId) {
      return;
    }
    
    const currentUserContactEntryRef = ref_contacts.child(currentUserId).child(contactId);

    if (userContacts[contactId]) {
      currentUserContactEntryRef.remove();
    } else {
      currentUserContactEntryRef.set(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#128C7E" />
        <Text>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#075e54" barStyle="light-content" />
      
      {searchActive ? (
        <View style={styles.searchHeader}>
          <TouchableOpacity 
            onPress={() => {
              setSearchActive(false);
              setSearch('');
            }}
            style={styles.searchBackButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#075e54" />
          </TouchableOpacity>
          <TextInput
            placeholder="Search..."
            value={search}
            onChangeText={text => setSearch(text)}
            style={styles.searchInput}
            placeholderTextColor="#888"
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      ) : null}
      
      {filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chat-remove" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            {search.trim() !== '' ? "No matches found" : "No conversations yet"}
          </Text>
          <Text style={styles.emptySubText}>
            {search.trim() !== '' ? `No users match "${search}"` : "Start chatting with someone"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const lastMessage = lastMessages[item.id];
            const isContact = userContacts[item.id];
            
            return (
              <>
                <TouchableOpacity 
                  style={styles.chatItem}
                  onPress={() => navigation.navigate("Chat", { 
                    currentUserId, 
                    secondUserId: item.id 
                  })}
                  delayLongPress={500}
                  onLongPress={() => toggleContact(item.id)}
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.avatar} />
                  ) : (
                    <Avatar.Text 
                      size={50} 
                      label={item.pseudo ? item.pseudo.charAt(0).toUpperCase() : '?'} 
                      style={styles.avatar}
                      color="#fff"
                      backgroundColor="#128C7E"
                    />
                  )}
                  
                  <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.userName}>{item.pseudo || 'User'}</Text>
                      <Text style={styles.timestamp}>
                        {lastMessage ? formatTime(lastMessage.timestamp) : ''}
                      </Text>
                    </View>
                    
                    <View style={styles.chatFooter}>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMessage ? (
                          <>
                            {lastMessage.sender === currentUserId && (
                              <MaterialCommunityIcons 
                                name={lastMessage.status === "read" ? "check-all" : "check"} 
                                size={16} 
                                color={lastMessage.status === "read" ? "#53bdeb" : "#8A8A8A"} 
                              />
                            )}
                            {' ' + truncateMessage(lastMessage.text)}
                          </>
                        ) : (
                          <Text style={styles.noMessages}>No messages yet</Text>
                        )}
                      </Text>
                      
                      <View style={styles.chatIcons}>
                        {isContact && (
                          <MaterialCommunityIcons 
                            name="star" 
                            size={18} 
                            color="#128C7E" 
                            style={styles.contactIcon} 
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                <Divider style={styles.divider} />
              </>
            );
          }}
        />
      )}
      
      <FAB
        style={styles.fab}
        icon="message-plus"
        color="#fff"
        onPress={() => navigation.navigate("Contacts")}
      />
      
      {!searchActive && (
        <FAB
          style={styles.searchFab}
          icon="magnify"
          color="#fff"
          size="small"
          onPress={() => setSearchActive(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
  },
  searchBackButton: {
    marginRight: 15,
    padding: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    color: '#666',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 16,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  chatContent: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#222',
  },
  timestamp: {
    fontSize: 12,
    color: '#8a8a8a',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8a8a8a',
    flex: 1,
  },
  noMessages: {
    fontStyle: 'italic',
    color: '#aaa',
  },
  chatIcons: {
    flexDirection: 'row',
  },
  contactIcon: {
    marginLeft: 5,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#e0e0e0',
    marginLeft: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#25D366',
  },
  searchFab: {
    position: 'absolute',
    right: 0,
    bottom: 90,
    margin: 16,
    backgroundColor: '#128C7E',
  },
});