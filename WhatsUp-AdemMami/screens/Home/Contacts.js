import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar,
  TextInput
} from 'react-native';
import { Avatar, Divider, FAB } from 'react-native-paper';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import firebase from '../../Config';

const database = firebase.database();

export default function Contacts({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchActive, setSearchActive] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    
    const contactsRef = database.ref(`Contacts/${currentUserId}`);
    
    const listener = contactsRef.on('value', async (snapshot) => {
      const contactsData = snapshot.val();

      if (contactsData) {
        const contactIds = Object.keys(contactsData);

        if (contactIds.length === 0) {
          setContacts([]);
          setFilteredContacts([]);
          setLoading(false);
          return;
        }

        const userPromises = contactIds.map(userId => 
          database.ref(`ListComptes/${userId}`).once('value')
        );
        
        try {
          const userSnapshots = await Promise.all(userPromises);
          const detailedContacts = userSnapshots.map(snap => ({
            id: snap.key,
            ...snap.val()
          })).sort((a, b) => {
            // Sort alphabetically by pseudo
            const pseudoA = a.pseudo?.toLowerCase() || '';
            const pseudoB = b.pseudo?.toLowerCase() || '';
            return pseudoA.localeCompare(pseudoB);
          });
          
          setContacts(detailedContacts);
          setFilteredContacts(detailedContacts);
        } catch (error) {
          console.error("Error fetching contacts:", error);
          setContacts([]);
          setFilteredContacts([]);
        } finally {
          setLoading(false);
        }
      } else {
        setContacts([]);
        setFilteredContacts([]);
        setLoading(false);
      }
    });

    return () => {
      contactsRef.off('value', listener);
    };
  }, [currentUserId]);

  // Improved search function to search across multiple fields
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = contacts.filter(contact => {
        const pseudo = contact.pseudo?.toLowerCase() || '';
        const numero = contact.numero?.toLowerCase() || '';
        const email = contact.email?.toLowerCase() || '';
        
        // Search in all relevant fields
        return pseudo.includes(query) || 
               numero.includes(query) || 
               email.includes(query);
      });
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const renderContactHeader = (firstLetter) => {
    return (
      <View style={styles.contactHeaderContainer}>
        <Text style={styles.contactHeaderText}>{firstLetter}</Text>
      </View>
    );
  };

  const renderContact = ({ item, index }) => {
    // Check if we need to show a header
    let showHeader = false;
    const currentFirstLetter = item.pseudo?.charAt(0).toUpperCase() || '?';
    
    if (index === 0) {
      showHeader = true;
    } else {
      const prevItem = filteredContacts[index - 1];
      const prevFirstLetter = prevItem.pseudo?.charAt(0).toUpperCase() || '?';
      if (prevFirstLetter !== currentFirstLetter) {
        showHeader = true;
      }
    }
    
    return (
      <>
        {showHeader && renderContactHeader(currentFirstLetter)}
        <TouchableOpacity 
          style={styles.contactItem}
          onPress={() => navigation.navigate('Chat', { 
            currentUserId, 
            secondUserId: item.id 
          })}
        >
          {item.image ? (
            <Avatar.Image source={{ uri: item.image }} size={46} style={styles.avatar} />
          ) : (
            <Avatar.Text 
              size={46} 
              label={item.pseudo?.charAt(0).toUpperCase() || '?'} 
              style={styles.avatar}
              color="#fff"
              backgroundColor="#128C7E"
            />
          )}
          
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.pseudo || 'Unknown User'}</Text>
            <Text style={styles.contactNumber}>
              {item.numero || 'No phone number'}
            </Text>
          </View>
          
          <View style={styles.contactActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Chat', { currentUserId, secondUserId: item.id })}
            >
              <MaterialCommunityIcons name="chat" size={22} color="#128C7E" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        <Divider style={styles.divider} />
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#128C7E" />
        <Text style={styles.loadingText}>Loading contacts...</Text>
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
              setSearchQuery('');
            }}
            style={styles.searchBackButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#075e54" />
          </TouchableOpacity>
          <TextInput
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#888"
            autoFocus
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      ) : null}
      
      {filteredContacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-group" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? "No matches found" : "No contacts"}
          </Text>
          <Text style={styles.emptySubText}>
            {searchQuery ? `No contacts match "${searchQuery}"` : "Add contacts from the user list"}
          </Text>
          <TouchableOpacity 
            style={styles.emptyAction}
            onPress={() => {
              if (searchQuery) {
                setSearchQuery('');
              } else {
                navigation.navigate('Chats');
              }
            }}
          >
            <Text style={styles.emptyActionText}>
              {searchQuery ? "Clear Search" : "Go to Chats"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.contactsList}
        />
      )}
      
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  emptyAction: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#128C7E',
    borderRadius: 25,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  contactsList: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  contactHeaderContainer: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  contactHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#128C7E',
  },
  contactItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  avatar: {
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
    marginBottom: 2,
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
  },
  contactActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#e0e0e0',
    marginLeft: 76,
  },
  searchFab: {
    position: 'absolute',
    right: 0,
    bottom: 16,
    margin: 16,
    backgroundColor: '#128C7E',
  },
});
