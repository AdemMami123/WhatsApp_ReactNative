import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput as RNTextInput,
} from 'react-native';
import { Avatar, Checkbox, Divider, TextInput, Button } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import firebase from '../Config';

const database = firebase.database();
const ref_listcomptes = database.ref("ListComptes");
const ref_contacts = database.ref("Contacts");
const ref_groups = database.ref("Groups");
const ref_groupMembers = database.ref("GroupMembers");

export default function CreateGroup({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    // Set up navigation options
    navigation.setOptions({
      headerShown: true,
      title: 'Create Group',
      headerStyle: {
        backgroundColor: '#075e54',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });

    // Fetch user's contacts
    const contactsRef = ref_contacts.child(currentUserId);

    contactsRef.once('value', async (snapshot) => {
      const contactsData = snapshot.val() || {};
      const contactIds = Object.keys(contactsData).filter(id => contactsData[id] === true);

      if (contactIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch contact details
      const contactPromises = contactIds.map(contactId => {
        return ref_listcomptes.child(contactId).once('value')
          .then(userSnapshot => {
            if (userSnapshot.exists()) {
              return { id: contactId, ...userSnapshot.val() };
            }
            return null;
          });
      });

      const contactsDetails = await Promise.all(contactPromises);
      const validContacts = contactsDetails.filter(contact => contact !== null);

      // Sort contacts alphabetically by pseudo
      validContacts.sort((a, b) => {
        const pseudoA = (a.pseudo || '').toLowerCase();
        const pseudoB = (b.pseudo || '').toLowerCase();
        return pseudoA.localeCompare(pseudoB);
      });

      setContacts(validContacts);
      setFilteredContacts(validContacts);
      setLoading(false);
    });
  }, [currentUserId, navigation]);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const searchLower = search.toLowerCase();
      const filtered = contacts.filter(contact => {
        const pseudo = (contact.pseudo || '').toLowerCase();
        const email = (contact.email || '').toLowerCase();
        const numero = (contact.numero || '').toLowerCase();

        return pseudo.includes(searchLower) ||
               email.includes(searchLower) ||
               numero.includes(searchLower);
      });
      setFilteredContacts(filtered);
    }
  }, [search, contacts]);

  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev => ({
      ...prev,
      [contactId]: !prev[contactId]
    }));
  };

  const createGroup = async () => {
    if (groupName.trim() === '') {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    const selectedContactIds = Object.keys(selectedContacts).filter(id => selectedContacts[id]);

    if (selectedContactIds.length === 0) {
      Alert.alert('Error', 'Please select at least one contact');
      return;
    }

    setCreating(true);

    try {
      // Get current user details
      const currentUserSnapshot = await ref_listcomptes.child(currentUserId).once('value');
      const currentUserData = currentUserSnapshot.val() || {};

      // Create new group
      const newGroupRef = ref_groups.push();
      const groupId = newGroupRef.key;

      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        createdBy: currentUserId,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        creatorName: currentUserData.pseudo || 'User',
      };

      await newGroupRef.set(groupData);

      // Add members to group
      const membersData = {};

      // Add current user as member
      membersData[currentUserId] = true;

      // Add selected contacts as members
      selectedContactIds.forEach(contactId => {
        membersData[contactId] = true;
      });

      // Save all members at once
      await ref_groupMembers.child(groupId).set(membersData);

      // Navigate to the group chat
      navigation.replace('GroupChat', {
        currentUserId,
        groupId
      });
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group: ' + error.message);
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#128C7E" />
        <Text>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#075e54" barStyle="light-content" />

      <View style={styles.formContainer}>
        <TextInput
          label="Group Name"
          value={groupName}
          onChangeText={setGroupName}
          style={styles.input}
          mode="outlined"
          outlineColor="#128C7E"
          activeOutlineColor="#075e54"
        />

        <TextInput
          label="Group Description (Optional)"
          value={groupDescription}
          onChangeText={setGroupDescription}
          style={styles.input}
          mode="outlined"
          outlineColor="#128C7E"
          activeOutlineColor="#075e54"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.contactsContainer}>
        <View style={styles.contactsHeader}>
          <Text style={styles.contactsTitle}>Add Participants</Text>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
            <RNTextInput
              placeholder="Search contacts..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-off" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No contacts found</Text>
            <Text style={styles.emptySubText}>Add contacts to create a group</Text>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <>
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => toggleContactSelection(item.id)}
                >
                  {item.image ? (
                    <Avatar.Image source={{ uri: item.image }} size={40} />
                  ) : (
                    <Avatar.Text
                      size={40}
                      label={item.pseudo ? item.pseudo.charAt(0).toUpperCase() : '?'}
                      color="#fff"
                      backgroundColor="#128C7E"
                    />
                  )}

                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{item.pseudo || 'User'}</Text>
                    <Text style={styles.contactEmail}>{item.email || ''}</Text>
                  </View>

                  <Checkbox
                    status={selectedContacts[item.id] ? 'checked' : 'unchecked'}
                    onPress={() => toggleContactSelection(item.id)}
                    color="#128C7E"
                  />
                </TouchableOpacity>
                <Divider style={styles.divider} />
              </>
            )}
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={createGroup}
          style={styles.createButton}
          labelStyle={styles.buttonLabel}
          loading={creating}
          disabled={creating || groupName.trim() === '' || Object.keys(selectedContacts).filter(id => selectedContacts[id]).length === 0}
        >
          Create Group
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  contactsContainer: {
    flex: 1,
  },
  contactsHeader: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  contactsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#075e54',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingHorizontal: 8,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
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
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#e0e0e0',
    marginLeft: 64,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  createButton: {
    backgroundColor: '#128C7E',
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
