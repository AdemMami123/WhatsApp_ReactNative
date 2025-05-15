import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, FAB, Divider } from 'react-native-paper';
import firebase from "../../Config";

const database = firebase.database();
const ref_groups = database.ref("Groups");
const ref_groupMembers = database.ref("GroupMembers");
const ref_groupMessages = database.ref("GroupMessages");
const ref_listcomptes = database.ref("ListComptes");

export default function Groups({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchActive, setSearchActive] = useState(false);
  const [lastMessages, setLastMessages] = useState({});

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    // Create a test group for debugging
    const createTestGroup = async () => {
      try {
        const testGroupId = 'test-group-1';
        const testGroupData = {
          name: 'Test Group',
          description: 'A test group for debugging',
          createdBy: currentUserId,
          createdAt: Date.now(),
          creatorName: 'Test User'
        };

        const testGroupMembersData = {};
        testGroupMembersData[currentUserId] = true;

        await ref_groups.child(testGroupId).set(testGroupData);
        await ref_groupMembers.child(testGroupId).set(testGroupMembersData);

        console.log('Test group created successfully');
      } catch (error) {
        console.error('Error creating test group:', error);
      }
    };

    // Create a test group for debugging
    createTestGroup();

    // Listen for groups where the current user is a member
    const groupMembersRef = ref_groupMembers;

    const groupsListener = groupMembersRef.on('value', async (snapshot) => {
      console.log('GroupMembers snapshot:', snapshot.val());

      // Check if there are any groups in the database
      if (!snapshot.exists()) {
        console.log('No groups found in database');
        setGroups([]);
        setFilteredGroups([]);
        setLoading(false);
        return;
      }

      // Filter groups where the current user is a member
      const groupIds = [];
      snapshot.forEach(groupSnapshot => {
        const groupId = groupSnapshot.key;
        const groupData = groupSnapshot.val();

        console.log(`Checking group ${groupId}:`, groupData);
        console.log(`Current user ID: ${currentUserId}`);

        // Check if the current user is a member of this group
        if (groupData && groupData[currentUserId] === true) {
          console.log(`User ${currentUserId} is a member of group ${groupId}`);
          groupIds.push(groupId);
        }
      });

      console.log('Found group IDs:', groupIds);

      // If no groups found for this user
      if (groupIds.length === 0) {
        console.log('No groups found for this user');
        setGroups([]);
        setFilteredGroups([]);
        setLoading(false);
        return;
      }

      // We already have the group IDs from above

      // Fetch group details for each group
      const groupPromises = groupIds.map(groupId => {
        return ref_groups.child(groupId).once('value')
          .then(groupSnapshot => {
            if (groupSnapshot.exists()) {
              return { id: groupId, ...groupSnapshot.val() };
            }
            return null;
          });
      });

      const groupsData = await Promise.all(groupPromises);
      const validGroups = groupsData.filter(group => group !== null);

      // Fetch last messages for each group
      const lastMsgsPromises = validGroups.map(group => {
        return ref_groupMessages.child(group.id)
          .orderByChild('timestamp')
          .limitToLast(1)
          .once('value')
          .then(snapshot => {
            if (snapshot.exists()) {
              let lastMsg = null;
              snapshot.forEach(msgSnap => {
                lastMsg = { id: msgSnap.key, ...msgSnap.val() };
              });
              return { groupId: group.id, lastMessage: lastMsg };
            }
            return { groupId: group.id, lastMessage: null };
          });
      });

      const lastMessagesResults = await Promise.all(lastMsgsPromises);
      const lastMessagesMap = {};
      lastMessagesResults.forEach(result => {
        if (result.lastMessage) {
          lastMessagesMap[result.groupId] = result.lastMessage;
        }
      });

      setLastMessages(lastMessagesMap);

      // Sort groups by last message timestamp (most recent first)
      validGroups.sort((a, b) => {
        const lastMsgA = lastMessagesMap[a.id];
        const lastMsgB = lastMessagesMap[b.id];

        if (!lastMsgA && !lastMsgB) return 0;
        if (!lastMsgA) return 1;
        if (!lastMsgB) return -1;

        return lastMsgB.timestamp - lastMsgA.timestamp;
      });

      setGroups(validGroups);
      setFilteredGroups(validGroups);
      setLoading(false);
    });

    return () => {
      groupMembersRef.off('value', groupsListener);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = groups.filter(group => {
        const name = (group.name || '').toLowerCase();
        const description = (group.description || '').toLowerCase();

        return name.includes(searchLower) || description.includes(searchLower);
      });
      setFilteredGroups(filtered);
    }
  }, [search, groups]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#128C7E" />
        <Text>Loading groups...</Text>
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
            placeholder="Search groups..."
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

      {filteredGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-group" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            {search.trim() !== '' ? "No matches found" : "No groups yet"}
          </Text>
          <Text style={styles.emptySubText}>
            {search.trim() !== '' ? `No groups match "${search}"` : "Create a new group to get started"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const lastMessage = lastMessages[item.id];

            return (
              <>
                <TouchableOpacity
                  style={styles.groupItem}
                  onPress={() => navigation.navigate("GroupChat", {
                    currentUserId,
                    groupId: item.id
                  })}
                  delayLongPress={500}
                  onLongPress={() => navigation.navigate("GroupDetails", {
                    currentUserId,
                    groupId: item.id
                  })}
                >
                  <Avatar.Text
                    size={50}
                    label={item.name ? item.name.charAt(0).toUpperCase() : 'G'}
                    style={styles.avatar}
                    color="#fff"
                    backgroundColor="#128C7E"
                  />

                  <View style={styles.groupContent}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupName}>{item.name || 'Group'}</Text>
                      <Text style={styles.timestamp}>
                        {lastMessage ? formatTime(lastMessage.timestamp) : ''}
                      </Text>
                    </View>

                    <View style={styles.groupFooter}>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMessage ? (
                          <>
                            {lastMessage.senderName && (
                              <Text style={styles.senderName}>{lastMessage.senderName}: </Text>
                            )}
                            {truncateMessage(lastMessage.text)}
                          </>
                        ) : (
                          <Text style={styles.noMessages}>No messages yet</Text>
                        )}
                      </Text>
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
        icon="account-group-outline"
        color="#fff"
        onPress={() => navigation.navigate("CreateGroup", { currentUserId })}
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
  groupItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  groupContent: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#222',
  },
  timestamp: {
    fontSize: 12,
    color: '#8a8a8a',
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#8a8a8a',
    flex: 1,
  },
  senderName: {
    fontWeight: '500',
    color: '#666',
  },
  noMessages: {
    fontStyle: 'italic',
    color: '#aaa',
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
