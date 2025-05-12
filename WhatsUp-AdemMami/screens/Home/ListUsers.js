import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import firebase from "../../Config";

const database = firebase.database();
const ref_listcomptes = database.ref("ListComptes");
const ref_contacts = database.ref("Contacts");

export default function ListUsers({ navigation, route }) {
  const currentUserId = route.params?.currentUserId;
  
  console.log("[ListUsers.js] Component mounted with currentUserId:", currentUserId);
  
  const [data, setData] = useState([]);
  const [userContacts, setUserContacts] = useState({});
  const [loading, setLoading] = useState(true);

  // Update user's contacts and fetch all users
  useEffect(() => {
    console.log("[ListUsers.js] useEffect running, currentUserId:", currentUserId);
    
    if (!currentUserId) {
      console.error("[ListUsers.js] No currentUserId provided, cannot filter users");
      setLoading(false);
      return;
    }

    // Fetch current user's contacts
    const currentUserContactsRef = ref_contacts.child(currentUserId);
    const contactsListener = currentUserContactsRef.on('value', snapshot => {
      console.log("[ListUsers.js] Contacts snapshot received:", snapshot.val());
      setUserContacts(snapshot.val() || {});
    }, error => {
      console.error("[ListUsers.js] Error fetching contacts:", error);
    });

    // Set up listener for users, explicitly filtering out the current user
    const usersListener = ref_listcomptes.on("value", (snapshot) => {
      console.log("[ListUsers.js] Users snapshot received, filtering with currentUserId:", currentUserId);
      
      const filteredUsers = [];
      let totalUsers = 0;
      let filteredCount = 0;
      
      snapshot.forEach(un_compte => {
        totalUsers++;
        const userData = un_compte.val();
        const userId = un_compte.key;
        
        console.log(`[ListUsers.js] Processing user: ${userId} (${userData.pseudo || 'unnamed'})`);
        console.log(`[ListUsers.js] Comparing with currentUserId: ${currentUserId}`);
        
        if (userId !== currentUserId) {
          filteredUsers.push({ ...userData, id: userId });
        } else {
          filteredCount++;
          console.log(`[ListUsers.js] Filtered out current user: ${userId}`);
        }
      });
      
      console.log(`[ListUsers.js] Found ${totalUsers} total users, filtered out ${filteredCount} (current user)`);
      console.log(`[ListUsers.js] Setting data with ${filteredUsers.length} users`);
      
      setData(filteredUsers);
      setLoading(false);
    }, error => {
      console.error("[ListUsers.js] Error fetching users:", error);
      setLoading(false);
    });

    // Clean up listeners on unmount
    return () => {
      console.log("[ListUsers.js] Cleaning up listeners");
      
      if (currentUserId) {
        currentUserContactsRef.off('value', contactsListener);
      }
      ref_listcomptes.off("value", usersListener);
    };
  }, [currentUserId]);

  // Function to add or remove a user from contacts
  const toggleContact = (contactId) => {
    console.log("[ListUsers.js] toggleContact called with contactId:", contactId); 
    if (!currentUserId) {
      console.error("[ListUsers.js] toggleContact: currentUserId is undefined");
      return;
    }
    if (!contactId) {
      console.error("[ListUsers.js] toggleContact: contactId is undefined");
      return;
    }
    console.log("[ListUsers.js] Current userContacts state before action:", userContacts);
    const currentUserContactEntryRef = ref_contacts.child(currentUserId).child(contactId);

    if (userContacts[contactId]) {
      console.log("[ListUsers.js] Attempting to remove contact:", contactId);
      currentUserContactEntryRef.remove()
        .then(() => console.log("[ListUsers.js] Contact removed successfully from Firebase:", contactId))
        .catch(error => console.error("[ListUsers.js] Error removing contact from Firebase:", error));
    } else {
      console.log("[ListUsers.js] Attempting to add contact:", contactId);
      currentUserContactEntryRef.set(true)
        .then(() => console.log("[ListUsers.js] Contact added successfully to Firebase:", contactId))
        .catch(error => console.error("[ListUsers.js] Error adding contact to Firebase:", error));
    }
  };

  // Show loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6974d6" />
        <Text>Loading users...</Text>
      </View>
    );
  }
  
  // Show no users message if empty
  if (data.length === 0) {
    return (
      <ImageBackground
        source={require("../../assets/walpaper.jpg")}
        style={styles.container}
      >
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No other users found</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/walpaper.jpg")}
      style={styles.container}
    >
      <FlatList
        data={data}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={() => navigation.navigate("Chat", { 
                currentUserId, 
                secondUserId: item.id 
              })}>
                <Image source={require("../../assets/favicon.png")} style={styles.avatar} />
              </TouchableOpacity>
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.pseudo}>{item.pseudo || 'User'}</Text>
              <TouchableOpacity
                onPress={() => {
                  if (item.numero) {
                    const telUrl = Platform.OS === "android"
                      ? `tel:${item.numero}`
                      : `telprompt:${item.numero}`;
                    Linking.openURL(telUrl);
                  }
                }}
              >
                <Text style={styles.numero}>{item.numero || 'No phone number'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => toggleContact(item.id)}
            >
              <Ionicons 
                name={userContacts[item.id] ? "person-remove" : "person-add"} 
                size={24} 
                color={userContacts[item.id] ? "#FF7F7F" : "#4CAF50"} 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => navigation.navigate("Chat", { 
                currentUserId,
                secondUserId: item.id 
              })}
            >
              <MaterialIcons name="chevron-right" size={30} color="#6974d6" />
            </TouchableOpacity>
          </View>
        )}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    paddingTop: 50,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  pseudo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
  },
  numero: {
    fontSize: 16,
    color: "#007bff",
    marginTop: 4,
  },
  messageButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#616161',
  },
});