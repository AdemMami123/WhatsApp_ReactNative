import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Avatar, Divider, Button, Dialog, Portal, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import firebase from '../Config';

const database = firebase.database();
const ref_groups = database.ref("Groups");
const ref_groupMembers = database.ref("GroupMembers");
const ref_groupMessages = database.ref("GroupMessages");
const ref_listcomptes = database.ref("ListComptes");
const ref_contacts = database.ref("Contacts");

export default function GroupDetails({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;
  const groupId = route.params?.groupId;

  const [groupInfo, setGroupInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmLeaveVisible, setConfirmLeaveVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [editDescriptionVisible, setEditDescriptionVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    if (!currentUserId || !groupId) {
      Alert.alert('Error', 'Missing user or group information');
      navigation.goBack();
      return;
    }

    // Set up navigation options
    navigation.setOptions({
      headerShown: true,
      title: 'Group Info',
      headerStyle: {
        backgroundColor: '#075e54',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });

    // Get group info
    const groupInfoListener = ref_groups.child(groupId).on('value', snapshot => {
      if (snapshot.exists()) {
        const groupData = snapshot.val();
        setGroupInfo(groupData);
        setNewGroupName(groupData.name || '');
        setNewGroupDescription(groupData.description || '');
        setIsAdmin(groupData.createdBy === currentUserId);
      } else {
        Alert.alert('Error', 'Group not found');
        navigation.goBack();
      }
    });

    // Get group members
    const groupMembersListener = ref_groupMembers.child(groupId).on('value', async snapshot => {
      if (snapshot.exists()) {
        const membersData = snapshot.val();
        const memberIds = Object.keys(membersData).filter(id => membersData[id] === true);

        // Fetch member details
        const memberPromises = memberIds.map(memberId => {
          return ref_listcomptes.child(memberId).once('value')
            .then(userSnapshot => {
              if (userSnapshot.exists()) {
                return {
                  id: memberId,
                  ...userSnapshot.val(),
                  isAdmin: memberId === groupInfo?.createdBy
                };
              }
              return null;
            });
        });

        const memberDetails = await Promise.all(memberPromises);
        const validMembers = memberDetails.filter(member => member !== null);

        // Sort members (admin first, then alphabetically by name)
        validMembers.sort((a, b) => {
          if (a.isAdmin && !b.isAdmin) return -1;
          if (!a.isAdmin && b.isAdmin) return 1;

          const nameA = (a.pseudo || '').toLowerCase();
          const nameB = (b.pseudo || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setMembers(validMembers);
        setLoading(false);
      }
    });

    return () => {
      ref_groups.child(groupId).off('value', groupInfoListener);
      ref_groupMembers.child(groupId).off('value', groupMembersListener);
    };
  }, [currentUserId, groupId, navigation]);

  const fetchAvailableContacts = async () => {
    try {
      // Get current user's contacts
      const contactsSnapshot = await ref_contacts.child(currentUserId).once('value');
      const contactsData = contactsSnapshot.val() || {};
      const contactIds = Object.keys(contactsData).filter(id => contactsData[id] === true);

      if (contactIds.length === 0) {
        setAvailableContacts([]);
        return;
      }

      // Get current group members
      const groupMembersSnapshot = await ref_groupMembers.child(groupId).once('value');
      const groupMembersData = groupMembersSnapshot.val() || {};
      const groupMemberIds = Object.keys(groupMembersData);

      // Filter contacts that are not already in the group
      const availableContactIds = contactIds.filter(id => !groupMemberIds.includes(id));

      if (availableContactIds.length === 0) {
        setAvailableContacts([]);
        return;
      }

      // Fetch contact details
      const contactPromises = availableContactIds.map(contactId => {
        return ref_listcomptes.child(contactId).once('value')
          .then(userSnapshot => {
            if (userSnapshot.exists()) {
              return { id: contactId, ...userSnapshot.val() };
            }
            return null;
          });
      });

      const contactDetails = await Promise.all(contactPromises);
      const validContacts = contactDetails.filter(contact => contact !== null);

      // Sort contacts alphabetically by name
      validContacts.sort((a, b) => {
        const nameA = (a.pseudo || '').toLowerCase();
        const nameB = (b.pseudo || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setAvailableContacts(validContacts);
    } catch (error) {
      console.error('Error fetching available contacts:', error);
      Alert.alert('Error', 'Failed to fetch contacts: ' + error.message);
    }
  };

  const handleAddMember = (contactId) => {
    // Get current members data
    ref_groupMembers.child(groupId).once('value')
      .then(snapshot => {
        const membersData = snapshot.val() || {};

        // Add new member
        membersData[contactId] = true;

        // Update members data
        return ref_groupMembers.child(groupId).set(membersData);
      })
      .then(() => {
        console.log('Member added successfully');
        setAddMemberVisible(false);
      })
      .catch(error => {
        console.error('Error adding member:', error);
        Alert.alert('Error', 'Failed to add member: ' + error.message);
      });
  };

  const handleRemoveMember = (memberId) => {
    if (memberId === currentUserId) {
      Alert.alert('Error', 'You cannot remove yourself from the group. Use the Leave Group option instead.');
      return;
    }

    if (memberId === groupInfo?.createdBy) {
      Alert.alert('Error', 'You cannot remove the group creator.');
      return;
    }

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the group?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // Get current members data
            ref_groupMembers.child(groupId).once('value')
              .then(snapshot => {
                const membersData = snapshot.val() || {};

                // Remove member
                delete membersData[memberId];

                // Update members data
                return ref_groupMembers.child(groupId).set(membersData);
              })
              .then(() => {
                console.log('Member removed successfully');
              })
              .catch(error => {
                console.error('Error removing member:', error);
                Alert.alert('Error', 'Failed to remove member: ' + error.message);
              });
          }
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    if (currentUserId === groupInfo?.createdBy) {
      Alert.alert(
        'Cannot Leave Group',
        'As the creator of this group, you cannot leave it. You can delete the group instead.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Get current members data
    ref_groupMembers.child(groupId).once('value')
      .then(snapshot => {
        const membersData = snapshot.val() || {};

        // Remove current user
        delete membersData[currentUserId];

        // Update members data
        return ref_groupMembers.child(groupId).set(membersData);
      })
      .then(() => {
        console.log('Left group successfully');
        navigation.navigate('Home');
      })
      .catch(error => {
        console.error('Error leaving group:', error);
        Alert.alert('Error', 'Failed to leave group: ' + error.message);
      });
  };

  const handleDeleteGroup = () => {
    if (currentUserId !== groupInfo?.createdBy) {
      Alert.alert('Error', 'Only the group creator can delete the group.');
      return;
    }

    // Delete group data
    const deletePromises = [
      ref_groups.child(groupId).remove(),
      ref_groupMembers.child(groupId).remove(),
      ref_groupMessages.child(groupId).remove()
    ];

    Promise.all(deletePromises)
      .then(() => {
        console.log('Group deleted successfully');
        navigation.navigate('Home');
      })
      .catch(error => {
        console.error('Error deleting group:', error);
        Alert.alert('Error', 'Failed to delete group: ' + error.message);
      });
  };

  const updateGroupName = () => {
    if (newGroupName.trim() === '') {
      Alert.alert('Error', 'Group name cannot be empty');
      return;
    }

    ref_groups.child(groupId).update({ name: newGroupName.trim() })
      .then(() => {
        console.log('Group name updated successfully');
        setEditNameVisible(false);
      })
      .catch(error => {
        console.error('Error updating group name:', error);
        Alert.alert('Error', 'Failed to update group name: ' + error.message);
      });
  };

  const updateGroupDescription = () => {
    ref_groups.child(groupId).update({ description: newGroupDescription.trim() })
      .then(() => {
        console.log('Group description updated successfully');
        setEditDescriptionVisible(false);
      })
      .catch(error => {
        console.error('Error updating group description:', error);
        Alert.alert('Error', 'Failed to update group description: ' + error.message);
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#128C7E" />
        <Text>Loading group details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#075e54" barStyle="light-content" />
      <ScrollView>
        <View style={styles.groupInfoContainer}>
          <Avatar.Text
            size={80}
            label={groupInfo?.name ? groupInfo.name.charAt(0).toUpperCase() : 'G'}
            color="#fff"
            backgroundColor="#128C7E"
            style={styles.groupAvatar}
          />

          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName}>{groupInfo?.name || 'Group'}</Text>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => setEditNameVisible(true)}
                style={styles.editButton}
              >
                <MaterialIcons name="edit" size={20} color="#128C7E" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.groupCreatedBy}>
            Created by {groupInfo?.creatorName || 'User'} on {new Date(groupInfo?.createdAt).toLocaleDateString()}
          </Text>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <View style={styles.descriptionContent}>
              <Text style={styles.descriptionText}>
                {groupInfo?.description || 'No description'}
              </Text>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => setEditDescriptionVisible(true)}
                  style={styles.editButton}
                >
                  <MaterialIcons name="edit" size={20} color="#128C7E" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.membersContainer}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersTitle}>
              {members.length} {members.length === 1 ? 'Member' : 'Members'}
            </Text>
            {isAdmin && (
              <Button
                mode="text"
                onPress={() => {
                  fetchAvailableContacts();
                  setAddMemberVisible(true);
                }}
                color="#128C7E"
                style={styles.addMemberButton}
              >
                Add
              </Button>
            )}
          </View>

          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <>
                <View style={styles.memberItem}>
                  {item.image ? (
                    <Avatar.Image source={{ uri: item.image }} size={50} />
                  ) : (
                    <Avatar.Text
                      size={50}
                      label={item.pseudo ? item.pseudo.charAt(0).toUpperCase() : '?'}
                      color="#fff"
                      backgroundColor={item.isAdmin ? "#075e54" : "#128C7E"}
                    />
                  )}

                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {item.pseudo || 'User'}
                      {item.id === currentUserId && ' (You)'}
                    </Text>
                    {item.isAdmin && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminText}>Admin</Text>
                      </View>
                    )}
                  </View>

                  {isAdmin && item.id !== currentUserId && (
                    <TouchableOpacity
                      onPress={() => handleRemoveMember(item.id)}
                      style={styles.removeButton}
                    >
                      <MaterialIcons name="remove-circle" size={24} color="#FF5252" />
                    </TouchableOpacity>
                  )}
                </View>
                <Divider style={styles.divider} />
              </>
            )}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.leaveButton]}
            onPress={() => setConfirmLeaveVisible(true)}
          >
            <MaterialCommunityIcons name="exit-to-app" size={24} color="#FF5252" />
            <Text style={styles.leaveButtonText}>Leave Group</Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => setConfirmDeleteVisible(true)}
            >
              <MaterialCommunityIcons name="delete" size={24} color="#FF5252" />
              <Text style={styles.deleteButtonText}>Delete Group</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Leave Group Dialog */}
      <Portal>
        <Dialog visible={confirmLeaveVisible} onDismiss={() => setConfirmLeaveVisible(false)}>
          <Dialog.Title>Leave Group</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to leave this group?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmLeaveVisible(false)}>Cancel</Button>
            <Button onPress={handleLeaveGroup} color="#FF5252">Leave</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Group Dialog */}
      <Portal>
        <Dialog visible={confirmDeleteVisible} onDismiss={() => setConfirmDeleteVisible(false)}>
          <Dialog.Title>Delete Group</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this group? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteGroup} color="#FF5252">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add Member Dialog */}
      <Portal>
        <Dialog visible={addMemberVisible} onDismiss={() => setAddMemberVisible(false)}>
          <Dialog.Title>Add Members</Dialog.Title>
          <Dialog.Content>
            {availableContacts.length === 0 ? (
              <Text>No contacts available to add</Text>
            ) : (
              <FlatList
                data={availableContacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => handleAddMember(item.id)}
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
                    <Text style={styles.contactName}>{item.pseudo || 'User'}</Text>
                  </TouchableOpacity>
                )}
                style={styles.contactsList}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddMemberVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Group Name Dialog */}
      <Portal>
        <Dialog visible={editNameVisible} onDismiss={() => setEditNameVisible(false)}>
          <Dialog.Title>Edit Group Name</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
              mode="outlined"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditNameVisible(false)}>Cancel</Button>
            <Button onPress={updateGroupName} color="#128C7E">Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Group Description Dialog */}
      <Portal>
        <Dialog visible={editDescriptionVisible} onDismiss={() => setEditDescriptionVisible(false)}>
          <Dialog.Title>Edit Group Description</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Group Description"
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDescriptionVisible(false)}>Cancel</Button>
            <Button onPress={updateGroupDescription} color="#128C7E">Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  groupInfoContainer: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  groupAvatar: {
    marginBottom: 15,
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    marginLeft: 10,
    padding: 5,
  },
  groupCreatedBy: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  descriptionContainer: {
    width: '100%',
    marginTop: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  descriptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  membersContainer: {
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 10,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addMemberButton: {
    marginRight: -10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 15,
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  adminBadge: {
    backgroundColor: '#128C7E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  adminText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 5,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#e0e0e0',
    marginLeft: 80,
  },
  actionsContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  leaveButton: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  leaveButtonText: {
    color: '#FF5252',
    fontSize: 16,
    marginLeft: 15,
  },
  deleteButton: {
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  deleteButtonText: {
    color: '#FF5252',
    fontSize: 16,
    marginLeft: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  contactName: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  contactsList: {
    maxHeight: 300,
  },
  dialogInput: {
    marginTop: 10,
    backgroundColor: '#fff',
  },
});
