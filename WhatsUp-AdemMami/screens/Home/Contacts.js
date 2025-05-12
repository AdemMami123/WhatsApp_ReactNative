import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import firebase from '../../Config';
import { Avatar } from 'react-native-paper';

const database = firebase.database();

export default function Contacts({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;
  const [contacts, setContacts] = useState([]);
  console.log("[Contacts.js] currentUserId:", currentUserId);

  useEffect(() => {
    if (!currentUserId) {
      console.log("[Contacts.js] useEffect: currentUserId is null or undefined, returning.");
      return;
    }
    console.log(`[Contacts.js] useEffect: Attaching listener to Contacts/${currentUserId}`);
    const contactsRef = database.ref(`Contacts/${currentUserId}`);
    
    const listener = contactsRef.on('value', async (snapshot) => {
      const contactsData = snapshot.val();
      console.log("[Contacts.js] Firebase contacts listener triggered. contactsData:", contactsData);

      if (contactsData) {
        const contactIds = Object.keys(contactsData);
        console.log("[Contacts.js] Extracted contactIds:", contactIds);

        if (contactIds.length === 0) {
          console.log("[Contacts.js] No contact IDs found, setting contacts to empty array.");
          setContacts([]);
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
          }));
          console.log("[Contacts.js] Fetched detailedContacts:", detailedContacts);
          setContacts(detailedContacts);
        } catch (error) {
          console.error("[Contacts.js] Error fetching user details for contacts:", error);
          setContacts([]); // Set to empty on error to avoid partial/stale data
        }
      } else {
        console.log("[Contacts.js] contactsData is null or undefined, setting contacts to empty array.");
        setContacts([]);
      }
    });

    return () => {
      console.log(`[Contacts.js] useEffect cleanup: Detaching listener from Contacts/${currentUserId}`);
      contactsRef.off('value', listener);
    };
  }, [currentUserId]);

  useEffect(() => {
    console.log("[Contacts.js] Contacts state updated:", contacts);
  }, [contacts]);

  const renderContact = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Chat', { currentUserId, secondUserId: item.id })}
    >
      <Avatar.Text size={40} label={item.pseudo ? item.pseudo.charAt(0).toUpperCase() : '?'} style={styles.avatar} />
      <View style={styles.textContainer}>
        <Text style={styles.pseudo}>{item.pseudo || 'N/A'}</Text>
        <Text style={styles.phone}>{item.numero || 'No phone number'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={require('../../assets/walpaper.jpg')}
      style={styles.container}
    >
      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No contacts yet.</Text>
          <Text style={styles.emptySubText}>Go to Users to add contacts.</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 10,
    paddingTop: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  avatar: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  pseudo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#777',
  },
});
